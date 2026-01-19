const TOKEN_KEY = "hh_token";
const PENDING_INVITE_KEY = "hh_pending_invite";

export const storageService = {
  setToken(token) { localStorage.setItem(TOKEN_KEY, token); },
  getToken() { return localStorage.getItem(TOKEN_KEY); },
  clearToken() { localStorage.removeItem(TOKEN_KEY); },
  setPendingInvite(token) { localStorage.setItem(PENDING_INVITE_KEY, token); },
  getPendingInvite() { return localStorage.getItem(PENDING_INVITE_KEY); },
  clearPendingInvite() { localStorage.removeItem(PENDING_INVITE_KEY); }
};
