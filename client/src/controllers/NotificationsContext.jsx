// client/src/controllers/NotificationsContext.jsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const NotificationsContext = createContext(null);

const STORAGE_KEY = "hm_notifications_v1";

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStorage(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

function getPermission() {
  try {
    if (typeof window === "undefined") return "unsupported";
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  } catch {
    return "unsupported";
  }
}

export function NotificationsProvider({ children }) {
  const stored = useMemo(() => readStorage(), []);

  const [enabled, setEnabled] = useState(stored?.enabled ?? true);
  const [leadMinutes, setLeadMinutes] = useState(stored?.leadMinutes ?? 30);
  const [overdueEnabled, setOverdueEnabled] = useState(stored?.overdueEnabled ?? true);
  const [useBrowser, setUseBrowser] = useState(stored?.useBrowser ?? false);
  const [refreshSeconds, setRefreshSeconds] = useState(stored?.refreshSeconds ?? 60);
  const [permission, setPermission] = useState(() => getPermission());

  useEffect(() => {
    writeStorage({ enabled, leadMinutes, overdueEnabled, useBrowser, refreshSeconds });
  }, [enabled, leadMinutes, overdueEnabled, useBrowser, refreshSeconds]);

  const requestPermission = useCallback(async () => {
    try {
      if (typeof Notification === "undefined") return "unsupported";
      const p = await Notification.requestPermission();
      setPermission(p);
      return p;
    } catch {
      return "unsupported";
    }
  }, []);

  const api = useMemo(() => {
    return {
      enabled,
      setEnabled,
      leadMinutes,
      setLeadMinutes,
      overdueEnabled,
      setOverdueEnabled,
      useBrowser,
      setUseBrowser,
      refreshSeconds,
      setRefreshSeconds,
      permission,
      requestPermission
    };
  }, [enabled, leadMinutes, overdueEnabled, useBrowser, refreshSeconds, permission, requestPermission]);

  return <NotificationsContext.Provider value={api}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within <NotificationsProvider />");
  return ctx;
}
