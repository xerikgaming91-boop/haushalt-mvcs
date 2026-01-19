import express from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { asyncHandler } from "../../common/middlewares/asyncHandler.js";
import { categoriesController } from "./categories.controller.js";

export function categoriesRoutes() {
  const router = express.Router();
  router.use(requireAuth);
  router.get("/:householdId", asyncHandler(categoriesController.list));
  router.post("/:householdId", asyncHandler(categoriesController.create));
  return router;
}
