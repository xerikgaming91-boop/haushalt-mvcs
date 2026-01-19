import express from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { asyncHandler } from "../../common/middlewares/asyncHandler.js";
import { householdsController } from "./households.controller.js";

export function householdsRoutes() {
  const router = express.Router();
  router.use(requireAuth);
  router.get("/", asyncHandler(householdsController.list));
  router.post("/", asyncHandler(householdsController.create));
  router.post("/:householdId/invites", asyncHandler(householdsController.createInvite));
  router.post("/invites/accept", asyncHandler(householdsController.acceptInvite));
  router.get("/:householdId/members", asyncHandler(householdsController.members));
  return router;
}
