import { AppError } from "../../common/errors/AppError.js";
import { categoriesRepository } from "./categories.repository.js";

export const categoriesService = {
  async list(userId, householdId) {
    const membership = await categoriesRepository.membership(householdId, userId);
    if (!membership) throw new AppError("Not a member of household", 403);
    return categoriesRepository.list(householdId);
  },
  async create(userId, householdId, dto) {
    const membership = await categoriesRepository.membership(householdId, userId);
    if (!membership) throw new AppError("Not a member of household", 403);
    return categoriesRepository.create(householdId, dto);
  }
};
