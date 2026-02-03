import React, { useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export function ConfirmDialog({
  open,
  title = "Bestätigen",
  message,
  confirmText = "Bestätigen",
  cancelText = "Abbrechen",
  variant = "danger", // danger | primary | neutral
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    variant === "primary"
      ? "tw-btn tw-btn-primary"
      : variant === "neutral"
      ? "tw-btn"
      : "tw-btn tw-btn-danger";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} aria-hidden="true" />

      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" role="dialog" aria-modal="true">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-100">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-semibold text-white">{title}</h3>
                {message ? <p className="mt-2 text-sm text-slate-300">{message}</p> : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-slate-950/40 px-6 py-4">
            <button type="button" className="tw-btn" onClick={onCancel}>
              {cancelText}
            </button>
            <button type="button" className={confirmClass} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
