import { AppError } from "../../common/errors/AppError.js";
import { createHouseholdSchema, createInviteSchema, acceptInviteSchema } from "./households.schemas.js";
import { householdsService } from "./households.service.js";

export const householdsController = {
  async list(req, res) {
    const households = await householdsService.list(req.user.id);
    return res.json({ households });
  },

  async create(req, res) {
    const parsed = createHouseholdSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);
    const household = await householdsService.create(req.user.id, parsed.data);
    return res.json({ household });
  },

  async createInvite(req, res) {
    const householdId = req.params.householdId;
    const parsed = createInviteSchema.safeParse(req.body || {});
    if (!parsed.success) throw new AppError("Invalid input", 400);
    const result = await householdsService.createInvite(req.user.id, householdId, parsed.data);
    return res.json(result);
  },

  async acceptInvite(req, res) {
    const parsed = acceptInviteSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);
    const result = await householdsService.acceptInvite(req.user.id, parsed.data.token);
    return res.json(result);
  },

  async members(req, res) {
    const householdId = req.params.householdId;
    const members = await householdsService.listMembers(req.user.id, householdId);
    return res.json({ members });
  }
};
