import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorMiddleware } from "./common/middlewares/error.middleware.js";

import { authRoutes } from "./modules/auth/auth.routes.js";
import { householdsRoutes } from "./modules/households/households.routes.js";
import { categoriesRoutes } from "./modules/categories/categories.routes.js";
import { tasksRoutes } from "./modules/tasks/tasks.routes.js";
import { shoppingRoutes } from "./modules/shopping/shopping.routes.js";

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

  app.use("/auth", authRoutes());
  app.use("/households", householdsRoutes());
  app.use("/categories", categoriesRoutes());
  app.use("/tasks", tasksRoutes());
  app.use("/shopping", shoppingRoutes());

  app.use(errorMiddleware);
  return app;
}
