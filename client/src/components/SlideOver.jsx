import React, { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function SlideOver({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  widthClass = "max-w-md",
}) {
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      <div
        className={[
          "absolute right-0 top-0 h-full w-full",
          widthClass,
          "border-l border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white">{title}</h2>
              {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
            </div>

            <button type="button" className="tw-icon-btn" onClick={onClose} aria-label="Schließen">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {footer ? <div className="border-t border-white/10 px-6 py-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
