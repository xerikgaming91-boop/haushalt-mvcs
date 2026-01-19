import { useCallback, useEffect, useState } from "react";
import { authService } from "../services/auth.service.js";
import { householdsService } from "../services/households.service.js";
import { storageService } from "../services/storage.service.js";

export function useAuthController() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const loadMe = useCallback(async () => {
    setLoadingMe(true);
    try {
      const token = storageService.getToken();
      if (!token) { setMe(null); return; }
      const data = await authService.me();
      setMe(data.user);

      const pending = storageService.getPendingInvite();
      if (pending) {
        try { await householdsService.acceptInvite(pending); }
        finally { storageService.clearPendingInvite(); }
      }
    } catch {
      setMe(null);
    } finally {
      setLoadingMe(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const register = useCallback(async (dto) => authService.register(dto), []);

  const login = useCallback(async (dto) => {
    const data = await authService.login(dto);
    storageService.setToken(data.token);
    await loadMe();
    return data;
  }, [loadMe]);

  const logout = useCallback(() => {
    storageService.clearToken();
    storageService.clearPendingInvite();
    setMe(null);
  }, []);

  const prepareInviteAcceptance = useCallback((token) => {
    storageService.setPendingInvite(token);
  }, []);

  const acceptInviteIfPossible = useCallback(async (token) => {
    if (!token) throw new Error("Kein Token im Link.");
    if (!me) return { requiresLogin: true };
    await householdsService.acceptInvite(token);
    await loadMe();
    return { requiresLogin: false };
  }, [me, loadMe]);

  return { me, loadingMe, loadMe, register, login, logout, prepareInviteAcceptance, acceptInviteIfPossible };
}
