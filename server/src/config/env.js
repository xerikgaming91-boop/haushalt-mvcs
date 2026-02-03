import { z } from "zod";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// server/src/config/env.js  -> server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "../..");
const envPath = path.join(serverRoot, ".env");

// 1) server/.env laden (stabil, unabhängig vom cwd)
dotenv.config({ path: envPath });

// 2) optional zusätzlich "normales" dotenv (falls jemand ENV von außen setzt)
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  APP_BASE_URL: z.string().default("http://localhost:5173")
});

export const env = envSchema.parse(process.env);
