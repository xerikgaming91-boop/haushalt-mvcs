import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

import { useNotificationEvents } from "../controllers/NotificationEventsContext.jsx";

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => (p[0] || "").toUpperCase()).join("");
}

function safeDate(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function kindBadge(kind) {
  if (kind === "success") return "border-green-500/30 bg-green-500/10 text-green-200";
  if (kind === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  if (kind === "error") return "border-red-500/30 bg-red-500/10 text-red-200";
  return "border-slate-700/50 bg-slate-950/40 text-slate-200";
}

export function Topbar({ me, onOpenSidebar, maxWidthClass = "max-w-6xl" }) {
  const navigate = useNavigate();
  const ev = useNotificationEvents();

  const unread = ev.unreadCount || 0;
  const latest = useMemo(() => (ev.events || []).slice(0, 10), [ev.events]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifBtnRef = useRef(null);
  const notifPanelRef = useRef(null);
  const profileBtnRef = useRef(null);
  const profilePanelRef = useRef(null);

  useEffect(() => {
    function onDocDown(e) {
      if (notifOpen) {
        const p = notifPanelRef.current;
        const b = notifBtnRef.current;
        if (p && !p.contains(e.target) && (!b || !b.contains(e.target))) setNotifOpen(false);
      }
      if (profileOpen) {
        const p = profilePanelRef.current;
        const b = profileBtnRef.current;
        if (p && !p.contains(e.target) && (!b || !b.contains(e.target))) setProfileOpen(false);
      }
    }

    function onEsc(e) {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [notifOpen, profileOpen]);

  const avatarUrl = me?.avatarUrl || me?.imageUrl || me?.avatar || "";

  return (
    <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/30 backdrop-blur">
      <div className={`mx-auto w-full ${maxWidthClass} px-4 sm:px-6 lg:px-8`}>
        <div className="flex h-16 items-center gap-x-4 sm:gap-x-6">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden -m-2.5 p-2.5 text-slate-200 hover:text-white"
            aria-label="Sidebar öffnen"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Separator (mobile) */}
          <div className="lg:hidden h-6 w-px bg-slate-800" />

          {/* Search (contained + centered vertically like Tailwind UI) */}
          <div className="flex flex-1 items-center">
            <form className="w-full max-w-2xl" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="search-field" className="sr-only">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="search-field"
                  name="search"
                  type="search"
                  placeholder="Search"
                  className="block h-10 w-full rounded-xl border border-slate-800 bg-slate-950/40 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </form>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-x-3 lg:gap-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                ref={notifBtnRef}
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                className="relative rounded-xl p-2.5 text-slate-200 hover:bg-slate-900/40 hover:text-white"
                aria-label="Benachrichtigungen"
              >
                <BellIcon className="h-6 w-6" />
                {unread > 0 ? (
                  <span className="absolute right-1 top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </button>

              {notifOpen ? (
                <div
                  ref={notifPanelRef}
                  className="absolute right-0 mt-2 w-[380px] max-w-[90vw] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl"
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="text-sm font-semibold text-slate-200">Benachrichtigungen</div>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 p-2 hover:bg-slate-900/40"
                      aria-label="Schließen"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="border-t border-slate-800">
                    {latest.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-slate-400">Keine Ereignisse.</div>
                    ) : (
                      <div className="max-h-[420px] overflow-y-auto">
                        {latest.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => ev.markRead(e.id)}
                            className="w-full border-b border-slate-800 px-4 py-3 text-left hover:bg-slate-900/40"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-sm font-semibold text-slate-200">{e.title}</span>
                                  {!e.read ? (
                                    <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-200">
                                      Neu
                                    </span>
                                  ) : null}
                                </div>

                                {e.message ? (
                                  <div className="mt-1 line-clamp-2 text-sm text-slate-300">{e.message}</div>
                                ) : null}

                                <div className="mt-2 flex items-center gap-2">
                                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${kindBadge(e.kind)}`}>
                                    {e.kind || "info"}
                                  </span>
                                  <span className="text-xs text-slate-500">{safeDate(e.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-800 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => ev.markAllRead()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/40"
                    >
                      <CheckIcon className="h-5 w-5" />
                      Alles gelesen
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate("/notifications");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/40"
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                      Alle anzeigen
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Separator */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-800" />

            {/* Profile */}
            <div className="relative">
              <button
                ref={profileBtnRef}
                type="button"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-900/40"
                aria-label="Profilmenü"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={me?.name || "Avatar"}
                    className="h-9 w-9 rounded-full border border-slate-800 object-cover"
                  />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-slate-800 bg-slate-950/40 text-sm font-bold text-slate-200">
                    {initials(me?.name)}
                  </div>
                )}

                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-slate-200">{me?.name || "—"}</div>
                </div>

                <ChevronDownIcon className="h-5 w-5 text-slate-400" />
              </button>

              {profileOpen ? (
                <div
                  ref={profilePanelRef}
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl"
                >
                  <div className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-200">{me?.name || "—"}</div>
                    <div className="text-xs text-slate-400">{me?.email || ""}</div>
                  </div>

                  <div className="border-t border-slate-800" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/notifications");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-900/40"
                  >
                    <BellIcon className="h-5 w-5" />
                    Benachrichtigungen
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/settings");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-900/40"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                    Settings
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
