import express from "express";
import { asyncHandler } from "../../common/middlewares/asyncHandler.js";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { backupController } from "./backup.controller.js";

export function backupRoutes() {
  const router = express.Router();

  router.use(requireAuth);

  router.get("/download", asyncHandler(backupController.download));
  router.post("/restore", asyncHandler(backupController.restore));

  return router;
}
