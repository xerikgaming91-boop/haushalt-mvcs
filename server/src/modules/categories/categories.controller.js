import { AppError } from "../../common/errors/AppError.js";
import { createCategorySchema } from "./categories.schemas.js";
import { categoriesService } from "./categories.service.js";

export const categoriesController = {
  async list(req, res) {
    const householdId = req.params.householdId;
    const categories = await categoriesService.list(req.user.id, householdId);
    return res.json({ categories });
  },
  async create(req, res) {
    const householdId = req.params.householdId;
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);
    const category = await categoriesService.create(req.user.id, householdId, parsed.data);
    return res.json({ category });
  }
};
