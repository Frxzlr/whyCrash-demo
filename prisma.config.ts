import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL?.trim() || "postgresql://postgres:postgres@localhost:5432/crashlab?schema=public",
  },
});
