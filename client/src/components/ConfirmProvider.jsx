import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null);
  const confirmBtnRef = useRef(null);

  const confirm = useCallback((options) => {
    const title = options?.title || "Bestätigen";
    const message = options?.message || "";
    const confirmText = options?.confirmText || "OK";
    const cancelText = options?.cancelText || "Abbrechen";
    const variant = options?.variant || "primary"; // primary | danger

    return new Promise((resolve) => {
      setReq({ title, message, confirmText, cancelText, variant, resolve });
      setTimeout(() => {
        try {
          confirmBtnRef.current?.focus();
        } catch {}
      }, 0);
    });
  }, []);

  const close = useCallback(
    (result) => {
      if (!req) return;
      try {
        req.resolve(Boolean(result));
      } finally {
        setReq(null);
      }
    },
    [req]
  );

  const api = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={api}>
      {children}

      {req && (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label={req.title}>
          <div className="modal">
            <div className="modalTitle">{req.title}</div>
            {req.message ? <div className="modalBody">{req.message}</div> : null}

            <div className="modalActions">
              <button onClick={() => close(false)}>{req.cancelText}</button>
              <button
                ref={confirmBtnRef}
                className={req.variant === "danger" ? "danger" : "primary"}
                onClick={() => close(true)}
              >
                {req.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within <ConfirmProvider>");
  }
  return ctx.confirm;
}
