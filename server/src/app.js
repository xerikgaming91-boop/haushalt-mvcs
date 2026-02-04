import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorMiddleware } from "./common/middlewares/error.middleware.js";

import { modules } from "./modules/index.js";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: false,
    })
  );

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // 🔌 MVCS: zentral registrierte Module mounten
  for (const m of modules) {
    app.use(m.basePath, m.factory());
  }

  app.use(errorMiddleware);

  return app;
}
