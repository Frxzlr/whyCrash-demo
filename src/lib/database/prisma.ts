import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { crashLabPrisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required for PostgreSQL persistence.");
  if (!globalForPrisma.crashLabPrisma) {
    const adapter = new PrismaPg({ connectionString });
    globalForPrisma.crashLabPrisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.crashLabPrisma;
}
