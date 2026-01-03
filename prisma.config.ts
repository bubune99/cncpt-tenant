import 'dotenv/config';
import path from "node:path";
import { defineConfig } from "prisma/config";

// Get the database URL (prefer unpooled for schema operations)
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED must be set');
}

// Prisma 7 config with datasource URL
// Uses unpooled connection for schema operations (db push, migrate)
export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),

  // Database connection for CLI commands (db push, migrate, etc.)
  datasource: {
    url: databaseUrl,
  },

  // Migrations and seed configuration
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});
