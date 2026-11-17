import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Prisma } from "@/generated/prisma/client";
import type { DebugSession } from "@/types/session";
import { getPrisma } from "./prisma";

const localDirectory = path.join(process.cwd(), ".crashlab");
const localFile = path.join(localDirectory, "sessions.json");
let pendingWrite: Promise<void> = Promise.resolve();

export function persistenceMode(): "postgres" | "local-file" {
  return process.env.DATABASE_URL?.trim() ? "postgres" : "local-file";
}

function fromPrisma(row: {
  id: string;
  title: string;
  input: string;
  diagnosis: Prisma.JsonValue | null;
  errorType: string | null;
  category: string | null;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}): DebugSession {
  return {
    ...row,
    diagnosis: row.diagnosis && typeof row.diagnosis === "object" ? row.diagnosis as unknown as DebugSession["diagnosis"] : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function readLocal(): Promise<DebugSession[]> {
  try {
    const raw = await readFile(localFile, "utf8");
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error("CrashLab session file must contain a JSON array.");
    return data as DebugSession[];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocal(sessions: DebugSession[]): Promise<void> {
  await mkdir(localDirectory, { recursive: true });
  const temporaryFile = `${localFile}.${randomUUID()}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(sessions, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryFile, localFile);
}

async function updateLocal<T>(update: (sessions: DebugSession[]) => T): Promise<T> {
  let result!: T;
  const transaction = pendingWrite.then(async () => {
    const sessions = await readLocal();
    result = update(sessions);
    await writeLocal(sessions);
  });
  pendingWrite = transaction.catch(() => undefined);
  await transaction;
  return result;
}

export async function listSessions(): Promise<DebugSession[]> {
  if (persistenceMode() === "postgres") {
    const rows = await getPrisma().debugSession.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
    return rows.map(fromPrisma);
  }
  return (await readLocal()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500);
}

export async function getSession(id: string): Promise<DebugSession | null> {
  if (persistenceMode() === "postgres") {
    const row = await getPrisma().debugSession.findUnique({ where: { id } });
    return row ? fromPrisma(row) : null;
  }
  return (await readLocal()).find((session) => session.id === id) ?? null;
}

export async function createSession(data: {
  title: string;
  input: string;
  diagnosis: DebugSession["diagnosis"];
  errorType: string | null;
  category: string | null;
}): Promise<DebugSession> {
  if (persistenceMode() === "postgres") {
    const row = await getPrisma().debugSession.create({
      data: {
        ...data,
        diagnosis: data.diagnosis ? data.diagnosis as unknown as Prisma.InputJsonValue : Prisma.JsonNull,
      },
    });
    return fromPrisma(row);
  }
  const now = new Date().toISOString();
  return updateLocal((sessions) => {
    const session: DebugSession = {
      id: randomUUID(), ...data, resolved: false, createdAt: now, updatedAt: now,
    };
    sessions.push(session);
    return session;
  });
}

export async function updateSession(id: string, data: { title?: string; resolved?: boolean }): Promise<DebugSession | null> {
  if (persistenceMode() === "postgres") {
    try {
      return fromPrisma(await getPrisma().debugSession.update({ where: { id }, data }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
      throw error;
    }
  }
  return updateLocal((sessions) => {
    const session = sessions.find((entry) => entry.id === id);
    if (!session) return null;
    Object.assign(session, data, { updatedAt: new Date().toISOString() });
    return session;
  });
}

export async function deleteSession(id: string): Promise<boolean> {
  if (persistenceMode() === "postgres") {
    try {
      await getPrisma().debugSession.delete({ where: { id } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return false;
      throw error;
    }
  }
  return updateLocal((sessions) => {
    const index = sessions.findIndex((entry) => entry.id === id);
    if (index < 0) return false;
    sessions.splice(index, 1);
    return true;
  });
}
