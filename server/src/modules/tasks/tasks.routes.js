import express from "express";
import { asyncHandler } from "../../common/middlewares/asyncHandler.js";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { tasksController } from "./tasks.controller.js";

export function tasksRoutes() {
  const router = express.Router();

  router.use(requireAuth);

  // Range endpoint: used by calendar & occurrences expansion
  router.get("/range", asyncHandler(tasksController.listRange));

  // CRUD
  router.post("/", asyncHandler(tasksController.create));
  router.patch("/:id/status", asyncHandler(tasksController.setStatus));
  router.patch("/:id/occurrence", asyncHandler(tasksController.setOccurrenceStatus));
  router.delete("/:id", asyncHandler(tasksController.remove));

  return router;
}
