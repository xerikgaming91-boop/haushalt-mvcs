import express from "express";
import { asyncHandler } from "../../common/middlewares/asyncHandler.js";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { shoppingController } from "./shopping.controller.js";

export function shoppingRoutes() {
  const router = express.Router();
  router.use(requireAuth);

  router.get("/", asyncHandler(shoppingController.list));
  router.post("/", asyncHandler(shoppingController.create));
  router.patch("/:id", asyncHandler(shoppingController.update));
  router.delete("/:id", asyncHandler(shoppingController.remove));

  return router;
}
