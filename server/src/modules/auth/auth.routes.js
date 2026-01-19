import express from "express";
import { asyncHandler } from "../../common/middlewares/asyncHandler.js";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { authController } from "./auth.controller.js";

export function authRoutes() {
  const router = express.Router();

  router.post("/register", asyncHandler(authController.register));
  router.post("/login", asyncHandler(authController.login));

  // Password reset (no auth)
  router.post("/forgot-password", asyncHandler(authController.forgotPassword));
  router.post("/reset-password", asyncHandler(authController.resetPassword));

  router.get("/me", requireAuth, asyncHandler(authController.me));

  return router;
}
