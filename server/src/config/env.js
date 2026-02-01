import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Lädt .env sowohl wenn du aus Root startest (server/.env)
// als auch wenn du direkt im server/ Ordner startest (.env)
const cwd = process.cwd();
const candidates = [
  path.resolve(cwd, "server", ".env"),
  path.resolve(cwd, ".env"),
];

const envPath = candidates.find((p) => fs.existsSync(p));
dotenv.config(envPath ? { path: envPath } : undefined);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  APP_BASE_URL: z.string().default("http://localhost:5173"),
});

export const env = envSchema.parse(process.env);
