import { apiClient } from "./apiClient.js";

export const categoriesService = {
  list(householdId) { return apiClient("/categories/" + householdId); },
  create(householdId, dto) { return apiClient("/categories/" + householdId, { method: "POST", body: dto }); }
};
