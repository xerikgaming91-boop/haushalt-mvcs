import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDashboard } from "../controllers/DashboardContext.jsx";
import { useNotifications } from "../controllers/NotificationsContext.jsx";
import { useTaskRangeController } from "../controllers/useTaskRangeController.js";
import { toast } from "./toastBus.js";
import { useNotificationEvents } from "../controllers/NotificationEventsContext.jsx";

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const NOTIFIED_KEY = "hm_notified_occurrences_v1";
const SEEN_ASSIGNED_TASKS_KEY = "hm_seen_assigned_tasks_v1";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function pruneMap(map, nowMs, keepDays = 14) {
  const keepMs = keepDays * 24 * 60 * 60 * 1000;
  const out = {};
  for (const [k, v] of Object.entries(map || {})) {
    if (typeof v === "number" && nowMs - v < keepMs) out[k] = v;
  }
  return out;
}

function minutesLabel(mins) {
  const m = Math.max(0, Math.round(mins));
  if (m === 0) return "jetzt";
  if (m === 1) return "in 1 Minute";
  return `in ${m} Minuten`;
}

function notifyBrowser(title, body) {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    // eslint-disable-next-line no-new
    new Notification(title, { body });
  } catch {
    // ignore
  }
}

/**
 * Background daemon that:
 * - emits toast reminders
 * - writes entries to the notifications event feed
 * - detects newly assigned tasks (polling-based, no backend changes required)
 */
export function NotificationDaemon({ me }) {
  const d = useDashboard();
  const n = useNotifications();
  const ev = useNotificationEvents();

  const [anchor, setAnchor] = useState(() => new Date());
  const anchorKey = useMemo(() => {
    const x = new Date(anchor);
    x.setHours(0, 0, 0, 0);
    return x.toISOString().slice(0, 10);
  }, [anchor]);

  const from = useMemo(() => startOfDay(new Date(anchorKey)), [anchorKey]);
  const to = useMemo(() => endOfDay(addDays(new Date(anchorKey), 7)), [anchorKey]);

  const tc = useTaskRangeController(d.activeHouseholdId, from, to);

  const occurrencesRef = useRef([]);
  const baseTasksRef = useRef([]);
  const reloadRef = useRef(tc.reload);
  const bootstrappedAssignedRef = useRef(false);
  const lastTickRef = useRef(0);

  useEffect(() => {
    occurrencesRef.current = tc.occurrences || [];
    baseTasksRef.current = tc.baseTasks || [];
    reloadRef.current = tc.reload;
  }, [tc.occurrences, tc.baseTasks, tc.reload]);

  useEffect(() => {
    if (!n.enabled) return;
    if (!d.activeHouseholdId) return;
    if (!me?.id) return;

    const tick = async () => {
      const nowMs = Date.now();
      if (nowMs - lastTickRef.current < 800) return;
      lastTickRef.current = nowMs;

      // day rollover
      try {
        const todayKey = new Date().toISOString().slice(0, 10);
        if (todayKey !== anchorKey) setAnchor(new Date());
      } catch {
        // ignore
      }

      // refresh
      try {
        await reloadRef.current?.();
      } catch {
        // ignore
      }

      // 1) detect newly assigned tasks to me (polling)
      try {
        const seen = pruneMap(readJson(SEEN_ASSIGNED_TASKS_KEY, {}), nowMs, 30);
        const assignedToMe = (baseTasksRef.current || []).filter((t) => t?.assignedTo?.id === me.id);

        if (!bootstrappedAssignedRef.current) {
          // seed on first run without emitting
          for (const t of assignedToMe) {
            if (t?.id) seen[`task:${t.id}`] = nowMs;
          }
          bootstrappedAssignedRef.current = true;
          writeJson(SEEN_ASSIGNED_TASKS_KEY, seen);
        } else {
          for (const t of assignedToMe) {
            if (!t?.id) continue;
            const k = `task:${t.id}`;
            if (seen[k]) continue;

            const due = t?.dueAt ? new Date(t.dueAt).toLocaleString() : "—";
            const title = "Neue Aufgabe für dich";
            const message = `${t.title || "Ohne Titel"} · Fällig: ${due}`;

            ev.addEvent({ kind: "info", title, message, type: "task_assigned", meta: { taskId: t.id } });
            toast({ kind: "info", title, message, durationMs: 6000 });

            seen[k] = nowMs;
          }
          writeJson(SEEN_ASSIGNED_TASKS_KEY, seen);
        }
      } catch {
        // ignore
      }

      // 2) due soon / overdue reminders
      const leadMs = Math.max(1, Number(n.leadMinutes || 30)) * 60 * 1000;
      const overdueWindowMs = 15 * 60 * 1000;

      const notified = pruneMap(readJson(NOTIFIED_KEY, {}), nowMs, 14);

      let emitted = 0;
      const EMIT_CAP = 5;

      for (const o of occurrencesRef.current || []) {
        if (emitted >= EMIT_CAP) break;
        if (!o?.key) continue;
        if (o.status === "DONE") continue;

        const dueMs = new Date(o.dueAt).getTime();
        if (Number.isNaN(dueMs)) continue;

        const soon = dueMs >= nowMs && dueMs <= nowMs + leadMs;
        if (soon) {
          const k = `soon:${o.key}`;
          if (!notified[k]) {
            const mins = (dueMs - nowMs) / 60000;
            const title = `Aufgabe fällig ${minutesLabel(mins)}`;
            const body = `${o.title}${o.assignedTo?.name ? ` · ${o.assignedTo.name}` : ""}`;

            ev.addEvent({ kind: "warning", title, message: body, type: "task_due_soon", meta: { occurrenceKey: o.key, taskId: o.taskId } });
            toast({ title, message: body, kind: "warning", durationMs: 6500 });

            if (n.useBrowser && n.permission === "granted") notifyBrowser(title, body);

            notified[k] = nowMs;
            emitted++;
          }
          continue;
        }

        if (n.overdueEnabled) {
          const overdue = dueMs < nowMs && nowMs - dueMs <= overdueWindowMs;
          if (overdue) {
            const k = `overdue:${o.key}`;
            if (!notified[k]) {
              const title = "Aufgabe überfällig";
              const body = `${o.title} · Fällig: ${new Date(o.dueAt).toLocaleString()}`;

              ev.addEvent({ kind: "error", title, message: body, type: "task_overdue", meta: { occurrenceKey: o.key, taskId: o.taskId } });
              toast({ title, message: body, kind: "error", durationMs: 7000 });

              if (n.useBrowser && n.permission === "granted") notifyBrowser(title, body);

              notified[k] = nowMs;
              emitted++;
            }
          }
        }
      }

      writeJson(NOTIFIED_KEY, notified);
    };

    tick();
    const intervalMs = Math.max(15, Number(n.refreshSeconds || 60)) * 1000;
    const h = setInterval(tick, intervalMs);
    return () => clearInterval(h);
  }, [
    n.enabled,
    n.leadMinutes,
    n.overdueEnabled,
    n.useBrowser,
    n.permission,
    n.refreshSeconds,
    d.activeHouseholdId,
    anchorKey,
    me?.id,
    ev
  ]);

  return null;
}
