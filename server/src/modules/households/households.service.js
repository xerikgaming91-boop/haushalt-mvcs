import crypto from "crypto";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/AppError.js";
import { householdsRepository } from "./households.repository.js";

export const householdsService = {
  async list(userId) {
    return householdsRepository.listForUser(userId);
  },

  async create(userId, { name }) {
    return householdsRepository.createHouseholdWithAdminMember({ name, createdById: userId });
  },

  async createInvite(userId, householdId, { email }) {
    const membership = await householdsRepository.findMembership({ householdId, userId });
    if (!membership) throw new AppError("Not a member of household", 403);
    if (membership.role !== "ADMIN") throw new AppError("Admin only", 403);

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await householdsRepository.createInvite({ householdId, token, email, expiresAt });
    const link = env.APP_BASE_URL + "/accept?token=" + encodeURIComponent(invite.token);
    return { invite: { id: invite.id, token: invite.token, expiresAt: invite.expiresAt }, link };
  },

  async acceptInvite(userId, token) {
    const invite = await householdsRepository.findInviteByToken(token);
    if (!invite) throw new AppError("Invite not found", 404);
    if (invite.acceptedAt) throw new AppError("Invite already accepted", 409);
    if (invite.expiresAt.getTime() < Date.now()) throw new AppError("Invite expired", 410);

    const membership = await householdsRepository.findMembership({ householdId: invite.householdId, userId });
    if (membership) {
      await householdsRepository.markInviteAccepted({ inviteId: invite.id, userId });
      return { ok: true, householdId: invite.householdId, alreadyMember: true };
    }

    await householdsRepository.acceptInviteTransaction({ inviteId: invite.id, householdId: invite.householdId, userId });
    return { ok: true, householdId: invite.householdId, alreadyMember: false };
  },

  async listMembers(userId, householdId) {
    const membership = await householdsRepository.findMembership({ householdId, userId });
    if (!membership) throw new AppError("Not a member of household", 403);
    return householdsRepository.listMembers(householdId);
  }
};
