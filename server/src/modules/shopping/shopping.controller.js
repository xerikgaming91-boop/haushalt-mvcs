import { AppError } from "../../common/errors/AppError.js";
import {
  createShoppingItemSchema,
  listShoppingSchema,
  updateShoppingItemSchema
} from "./shopping.schemas.js";
import { shoppingService } from "./shopping.service.js";

export const shoppingController = {
  async list(req, res) {
    const parsed = listShoppingSchema.safeParse(req.query);
    if (!parsed.success) throw new AppError("Invalid query", 400);

    const { householdId, includePurchased } = parsed.data;
    const items = await shoppingService.list(req.user.id, householdId, includePurchased);
    return res.json({ items });
  },

  async create(req, res) {
    const parsed = createShoppingItemSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);

    const item = await shoppingService.create(req.user.id, parsed.data);
    return res.json({ item });
  },

  async update(req, res) {
    const parsed = updateShoppingItemSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);

    const { id } = req.params;
    const item = await shoppingService.update(req.user.id, id, parsed.data);
    return res.json({ item });
  },

  async remove(req, res) {
    const { id } = req.params;
    const result = await shoppingService.remove(req.user.id, id);
    return res.json(result);
  }
};
