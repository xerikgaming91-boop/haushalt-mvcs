import { AppError } from "../../common/errors/AppError.js";
import { shoppingRepository } from "./shopping.repository.js";

export const shoppingService = {
  async list(userId, householdId, includePurchased) {
    const member = await shoppingRepository.assertMember(userId, householdId);
    if (!member) throw new AppError("Not allowed", 403);

    return shoppingRepository.listItems(householdId, includePurchased ?? true);
  },

  async create(userId, dto) {
    const member = await shoppingRepository.assertMember(userId, dto.householdId);
    if (!member) throw new AppError("Not allowed", 403);

    return shoppingRepository.createItem({
      householdId: dto.householdId,
      name: dto.name,
      quantity: dto.quantity || null,
      note: dto.note || null,
      createdById: userId,
      isPurchased: false,
      purchasedAt: null,
      purchasedById: null
    });
  },

  async update(userId, itemId, patch) {
    const existing = await shoppingRepository.findById(itemId);
    if (!existing) throw new AppError("Item not found", 404);

    const member = await shoppingRepository.assertMember(userId, existing.householdId);
    if (!member) throw new AppError("Not allowed", 403);

    const data = {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.quantity !== undefined ? { quantity: patch.quantity } : {}),
      ...(patch.note !== undefined ? { note: patch.note } : {})
    };

    if (patch.isPurchased !== undefined) {
      if (patch.isPurchased) {
        data.isPurchased = true;
        data.purchasedAt = new Date();
        data.purchasedById = userId;
      } else {
        data.isPurchased = false;
        data.purchasedAt = null;
        data.purchasedById = null;
      }
    }

    return shoppingRepository.updateItem(itemId, data);
  },

  async remove(userId, itemId) {
    const existing = await shoppingRepository.findById(itemId);
    if (!existing) throw new AppError("Item not found", 404);

    const member = await shoppingRepository.assertMember(userId, existing.householdId);
    if (!member) throw new AppError("Not allowed", 403);

    await shoppingRepository.deleteItem(itemId);
    return { ok: true };
  }
};
