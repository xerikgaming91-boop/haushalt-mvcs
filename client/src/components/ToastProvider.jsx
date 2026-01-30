// client/src/components/ToastProvider.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/solid";

import { clearToasts, dismissToast, subscribeToToasts } from "./toastBus.js";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function kindMeta(kind) {
  switch (kind) {
    case "success":
      return {
        icon: CheckCircleIcon,
        ring: "ring-green-500/20",
        border: "border-green-500/30",
        accent: "bg-green-500",
        badge: "bg-green-500/10 text-green-200 border-green-500/30"
      };
    case "warning":
      return {
        icon: ExclamationTriangleIcon,
        ring: "ring-amber-500/20",
        border: "border-amber-500/30",
        accent: "bg-amber-500",
        badge: "bg-amber-500/10 text-amber-200 border-amber-500/30"
      };
    case "error":
      return {
        icon: XCircleIcon,
        ring: "ring-red-500/20",
        border: "border-red-500/30",
        accent: "bg-red-500",
        badge: "bg-red-500/10 text-red-200 border-red-500/30"
      };
    case "info":
    default:
      return {
        icon: InformationCircleIcon,
        ring: "ring-blue-500/20",
        border: "border-blue-500/30",
        accent: "bg-blue-500",
        badge: "bg-blue-500/10 text-blue-200 border-blue-500/30"
      };
  }
}

function normalizeToast(input) {
  const kind = input.kind || "info";
  const durationMs = clamp(Number(input.durationMs ?? 5500), 1500, 20000);

  return {
    id: input.id || uid(),
    kind,
    title: input.title || (kind === "warning" ? "Hinweis" : kind === "error" ? "Fehler" : "Info"),
    message: input.message || "",
    durationMs,
    createdAt: Date.now(),
    visible: false
  };
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  // keep latest timers
  const timersRef = useRef(new Map());

  useEffect(() => {
    const unsubscribe = subscribeToToasts((action) => {
      if (!action || !action.type) return;

      if (action.type === "ADD") {
        const t = normalizeToast(action.payload || {});
        setItems((prev) => {
          // newest on top, cap list
          const next = [t, ...(prev || [])].slice(0, 6);
          return next;
        });

        // animate in next tick
        requestAnimationFrame(() => {
          setItems((prev) => (prev || []).map((x) => (x.id === t.id ? { ...x, visible: true } : x)));
        });

        // auto dismiss
        const handle = setTimeout(() => {
          startDismiss(t.id);
        }, t.durationMs);

        timersRef.current.set(t.id, handle);
      }

      if (action.type === "DISMISS") {
        startDismiss(action.id);
      }

      if (action.type === "CLEAR") {
        // clear timers
        for (const h of timersRef.current.values()) clearTimeout(h);
        timersRef.current.clear();
        setItems([]);
      }
    });

    return () => {
      unsubscribe();
      for (const h of timersRef.current.values()) clearTimeout(h);
      timersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startDismiss(id) {
    if (!id) return;

    // clear timer
    const h = timersRef.current.get(id);
    if (h) clearTimeout(h);
    timersRef.current.delete(id);

    // animate out
    setItems((prev) => (prev || []).map((t) => (t.id === id ? { ...t, visible: false } : t)));

    // remove after transition
    setTimeout(() => {
      setItems((prev) => (prev || []).filter((t) => t.id !== id));
    }, 180);
  }

  const rendered = useMemo(() => items || [], [items]);

  return (
    <>
      {children}

      {/* Toast viewport */}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[24rem] max-w-[calc(100vw-2rem)] flex-col gap-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {rendered.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => startDismiss(t.id)} />
        ))}

        {/* Optional: debug/quick clear (can be removed) */}
        {/* {rendered.length > 0 ? (
          <button
            className="pointer-events-auto self-end rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900/40"
            onClick={() => clearToasts()}
            type="button"
          >
            Alle schließen
          </button>
        ) : null} */}
      </div>
    </>
  );
}

function ToastItem({ toast, onClose }) {
  const meta = kindMeta(toast.kind);
  const Icon = meta.icon;

  const base =
    "pointer-events-auto relative overflow-hidden rounded-2xl border bg-slate-950/90 shadow-2xl ring-1 backdrop-blur";
  const border = meta.border;
  const ring = meta.ring;

  const anim = toast.visible
    ? "translate-x-0 opacity-100"
    : "translate-x-2 opacity-0";

  return (
    <div className={`${base} ${border} ${ring} transition-all duration-150 ${anim}`}>
      {/* accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 ${meta.accent}`} />

      <div className="flex gap-3 p-4">
        <div className="mt-0.5">
          <Icon className="h-6 w-6 text-slate-200" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-sm font-semibold text-slate-100">{toast.title}</div>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
                  {toast.kind}
                </span>
              </div>

              {toast.message ? (
                <div className="mt-1 break-words text-sm text-slate-300">{toast.message}</div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-900/50 hover:text-slate-100"
              aria-label="Toast schließen"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* subtle divider */}
          <div className="mt-3 h-px w-full bg-slate-800/70" />
        </div>
      </div>
    </div>
  );
}

// Optional helper exports (falls du das irgendwo nutzt)
export function useToast() {
  return { toast, dismissToast, clearToasts };
}
