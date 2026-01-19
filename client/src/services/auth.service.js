import { apiClient } from "./apiClient.js";

export const authService = {
  register(dto) {
    return apiClient("/auth/register", { method: "POST", auth: false, body: dto });
  },
  login(dto) {
    return apiClient("/auth/login", { method: "POST", auth: false, body: dto });
  },
  me() {
    return apiClient("/auth/me", { method: "GET" });
  },

  forgotPassword(email) {
    return apiClient("/auth/forgot-password", {
      method: "POST",
      auth: false,
      body: { email }
    });
  },

  resetPassword(token, newPassword) {
    return apiClient("/auth/reset-password", {
      method: "POST",
      auth: false,
      body: { token, newPassword }
    });
  }
};
