// client/src/components/toastBus.js
const listeners = new Set();

/**
 * action:
 *  - { type: "ADD", payload: ToastInput }
 *  - { type: "DISMISS", id: string }
 *  - { type: "CLEAR" }
 */
function emit(action) {
  for (const fn of listeners) fn(action);
}

export function subscribeToToasts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * ToastInput:
 * { title?: string, message?: string, kind?: "info"|"success"|"warning"|"error", durationMs?: number, id?: string }
 */
export function toast(input = {}) {
  emit({ type: "ADD", payload: input });
}

export function dismissToast(id) {
  emit({ type: "DISMISS", id });
}

export function clearToasts() {
  emit({ type: "CLEAR" });
}
