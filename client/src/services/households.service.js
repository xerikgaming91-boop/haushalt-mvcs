import { apiClient } from "./apiClient.js";

export const householdsService = {
  list() { return apiClient("/households"); },
  create(dto) { return apiClient("/households", { method: "POST", body: dto }); },
  members(householdId) { return apiClient("/households/" + householdId + "/members"); },
  createInvite(householdId, dto) { return apiClient("/households/" + householdId + "/invites", { method: "POST", body: dto || {} }); },
  acceptInvite(token) { return apiClient("/households/invites/accept", { method: "POST", body: { token: token } }); }
};
