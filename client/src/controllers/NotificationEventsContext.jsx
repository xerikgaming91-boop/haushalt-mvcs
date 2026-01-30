import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const NotificationEventsContext = createContext(null);

const STORAGE_KEY = "hm_notification_events_v1";
const MAX_EVENTS = 200;

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeStorage(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // ignore
  }
}

export function NotificationEventsProvider({ children }) {
  const [events, setEvents] = useState(() => readStorage());

  useEffect(() => {
    writeStorage(events);
  }, [events]);

  const unreadCount = useMemo(() => {
    return (events || []).reduce((acc, e) => acc + (e?.read ? 0 : 1), 0);
  }, [events]);

  const addEvent = useCallback((input) => {
    const e = {
      id: uid(),
      kind: input?.kind || "info",
      title: input?.title || "Info",
      message: input?.message || "",
      type: input?.type || "generic",
      meta: input?.meta ?? null,
      createdAt: Date.now(),
      read: false
    };

    setEvents((prev) => [e, ...(prev || [])].slice(0, MAX_EVENTS));
    return e.id;
  }, []);

  const markRead = useCallback((id) => {
    setEvents((prev) => (prev || []).map((e) => (e.id === id ? { ...e, read: true } : e)));
  }, []);

  const markUnread = useCallback((id) => {
    setEvents((prev) => (prev || []).map((e) => (e.id === id ? { ...e, read: false } : e)));
  }, []);

  const markAllRead = useCallback(() => {
    setEvents((prev) => (prev || []).map((e) => ({ ...e, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setEvents([]);
  }, []);

  const value = useMemo(() => {
    return { events, unreadCount, addEvent, markRead, markUnread, markAllRead, clearAll };
  }, [events, unreadCount, addEvent, markRead, markUnread, markAllRead, clearAll]);

  return <NotificationEventsContext.Provider value={value}>{children}</NotificationEventsContext.Provider>;
}

export function useNotificationEvents() {
  const ctx = useContext(NotificationEventsContext);
  if (!ctx) throw new Error("useNotificationEvents must be used within <NotificationEventsProvider />");
  return ctx;
}
