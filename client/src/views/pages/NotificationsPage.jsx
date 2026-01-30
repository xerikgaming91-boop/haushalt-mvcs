import React, { useMemo, useState } from "react";
import {
  BellIcon,
  Cog6ToothIcon,
  TrashIcon,
  CheckIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

import { useNotifications } from "../../controllers/NotificationsContext.jsx";
import { useNotificationEvents } from "../../controllers/NotificationEventsContext.jsx";
import { toast } from "../../components/toastBus.js";

function kindIcon(kind) {
  const cls = "h-5 w-5";
  if (kind === "success") return <CheckCircleIcon className={cls} />;
  if (kind === "warning") return <ExclamationTriangleIcon className={cls} />;
  if (kind === "error") return <XCircleIcon className={cls} />;
  return <InformationCircleIcon className={cls} />;
}

function kindRing(kind) {
  if (kind === "success") return "ring-green-500/30 border-green-500/30";
  if (kind === "warning") return "ring-amber-500/30 border-amber-500/30";
  if (kind === "error") return "ring-red-500/30 border-red-500/30";
  return "ring-slate-700/40 border-slate-800";
}

export function NotificationsPage() {
  const n = useNotifications();
  const ev = useNotificationEvents();
  const [tab, setTab] = useState("events"); // 'events' | 'settings'

  const permissionLabel = useMemo(() => {
    if (n.permission === "granted") return "Erlaubt";
    if (n.permission === "denied") return "Blockiert";
    if (n.permission === "default") return "Nicht entschieden";
    return "Nicht unterstützt";
  }, [n.permission]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-800 bg-slate-950/40">
                <BellIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Benachrichtigungen</h2>
                <p className="text-sm text-slate-400">
                  Ereignisse (Inbox) + Einstellungen. Unread: <span className="text-slate-200 font-semibold">{ev.unreadCount}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("events")}
              className={[
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                tab === "events"
                  ? "border-blue-500/40 bg-slate-900/50 text-white"
                  : "border-slate-800 bg-slate-950/40 text-slate-200 hover:bg-slate-900/40"
              ].join(" ")}
            >
              <BellIcon className="h-5 w-5" />
              Ereignisse
            </button>

            <button
              type="button"
              onClick={() => setTab("settings")}
              className={[
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                tab === "settings"
                  ? "border-blue-500/40 bg-slate-900/50 text-white"
                  : "border-slate-800 bg-slate-950/40 text-slate-200 hover:bg-slate-900/40"
              ].join(" ")}
            >
              <Cog6ToothIcon className="h-5 w-5" />
              Einstellungen
            </button>
          </div>
        </div>
      </div>

      {tab === "events" ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-400">
              Hier erscheinen u. a. „Neue Aufgabe für dich“, „bald fällig“, „überfällig“.
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={ev.markAllRead}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-semibold hover:bg-slate-900/40"
              >
                <CheckIcon className="h-5 w-5" />
                Alles gelesen
              </button>

              <button
                type="button"
                onClick={ev.clearAll}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-semibold hover:bg-slate-900/40"
              >
                <TrashIcon className="h-5 w-5" />
                Leeren
              </button>
            </div>
          </div>

          <hr className="my-4 border-slate-800" />

          {(!ev.events || ev.events.length === 0) ? (
            <div className="text-sm text-slate-400">Keine Ereignisse.</div>
          ) : (
            <div className="space-y-3">
              {ev.events.map((e) => (
                <div
                  key={e.id}
                  className={[
                    "rounded-2xl border bg-slate-950/40 p-4 ring-1",
                    kindRing(e.kind),
                    e.read ? "opacity-80" : "opacity-100"
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-800 bg-slate-950/40">
                        {kindIcon(e.kind)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-semibold">{e.title}</div>
                          {!e.read ? (
                            <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-200">
                              Neu
                            </span>
                          ) : null}
                        </div>

                        {e.message ? (
                          <div className="mt-1 text-sm text-slate-300">
                            {e.message}
                          </div>
                        ) : null}

                        <div className="mt-2 text-xs text-slate-500">
                          {new Date(e.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {!e.read ? (
                        <button
                          type="button"
                          onClick={() => ev.markRead(e.id)}
                          className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs font-semibold hover:bg-slate-900/40"
                        >
                          Gelesen
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => ev.markUnread(e.id)}
                          className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs font-semibold hover:bg-slate-900/40"
                        >
                          Ungelesen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
          <h3 className="text-base font-semibold">Einstellungen</h3>
          <p className="mt-1 text-sm text-slate-400">
            In-App Toastr und optional Browser-Systembenachrichtigungen (nur wenn Tab offen).
          </p>

          <hr className="my-4 border-slate-800" />

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={n.enabled}
                onChange={(e) => n.setEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <div>
                <div className="text-sm font-semibold">Erinnerungen aktivieren</div>
                <div className="text-xs text-slate-400">Reminder und Events werden erzeugt.</div>
              </div>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[240px]">
                <div className="text-sm font-semibold">Vorwarnzeit (Minuten)</div>
                <div className="text-xs text-slate-400">Reminder vor Fälligkeit.</div>
              </div>
              <input
                type="number"
                min={1}
                max={1440}
                value={n.leadMinutes}
                onChange={(e) => n.setLeadMinutes(Math.max(1, Number(e.target.value || 30)))}
                className="w-28 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm"
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={n.overdueEnabled}
                onChange={(e) => n.setOverdueEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <div>
                <div className="text-sm font-semibold">Überfällig-Hinweise</div>
                <div className="text-xs text-slate-400">Event + Toast beim „gerade überfällig“.</div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={n.useBrowser}
                onChange={(e) => n.setUseBrowser(e.target.checked)}
                className="h-4 w-4"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold">Browser-Systembenachrichtigungen</div>
                <div className="text-xs text-slate-400">Status: {permissionLabel}</div>
              </div>

              <button
                type="button"
                className="ml-auto rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-semibold hover:bg-slate-900/40 disabled:opacity-50"
                onClick={async () => {
                  await n.requestPermission();
                }}
                disabled={n.permission === "unsupported" || n.permission === "granted"}
              >
                Berechtigung anfragen
              </button>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[240px]">
                <div className="text-sm font-semibold">Refresh-Intervall (Sekunden)</div>
                <div className="text-xs text-slate-400">Wie oft geprüft wird.</div>
              </div>
              <input
                type="number"
                min={15}
                max={3600}
                value={n.refreshSeconds}
                onChange={(e) => n.setRefreshSeconds(Math.max(15, Number(e.target.value || 60)))}
                className="w-28 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-semibold hover:bg-slate-900/40"
                onClick={() => {
                  toast({ title: "Test", message: "Benachrichtigungen sind aktiv.", kind: "info" });
                }}
              >
                Test-Toast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
