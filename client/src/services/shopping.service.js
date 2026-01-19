import { apiClient } from "./apiClient.js";

function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}

export const shoppingService = {
  list({ householdId, includePurchased = true }) {
    const query = qs({ householdId, includePurchased });
    return apiClient(`/shopping?${query}`, { method: "GET" });
  },

  create(dto) {
    return apiClient(`/shopping`, { method: "POST", body: dto });
  },

  update(id, patch) {
    return apiClient(`/shopping/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
  },

  remove(id) {
    return apiClient(`/shopping/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
};
