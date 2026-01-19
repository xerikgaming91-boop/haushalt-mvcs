import { apiClient } from "./apiClient.js";

function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}

function iso(d) {
  return d.toISOString();
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export const tasksService = {
  /**
   * Backwards compatible:
   * Viele Stellen im Code erwarten tasksService.list(...)
   *
   * Unterstützt:
   *  - list(householdId)
   *  - list({ householdId })
   *
   * Rückgabe: Array<Task>
   */
  async list(arg) {
    const householdId = typeof arg === "string" ? arg : arg?.householdId;
    if (!householdId) throw new Error("tasksService.list: householdId fehlt");

    // 1) Versuche alten Endpoint (falls vorhanden): GET /tasks?householdId=...
    try {
      const query = qs({ householdId });
      const r = await apiClient(`/tasks?${query}`, { method: "GET" });

      // Manche APIs geben { tasks: [...] }, manche direkt [...]
      if (Array.isArray(r)) return r;
      if (r && Array.isArray(r.tasks)) return r.tasks;

      // Falls das Backend etwas anderes zurückgibt:
      return [];
    } catch (e) {
      // 2) Fallback: Range-Endpoint (wenn du auf /tasks/range umgestellt hast)
      const from = addMonths(new Date(), -6); // 6 Monate zurück
      const to = addMonths(new Date(), 24);   // 24 Monate vor

      const query = qs({
        householdId,
        from: iso(from),
        to: iso(to)
      });

      const rr = await apiClient(`/tasks/range?${query}`, { method: "GET" });

      // Range liefert { tasks, occurrenceStatuses }
      if (rr && Array.isArray(rr.tasks)) return rr.tasks;
      return [];
    }
  },

  /**
   * Range endpoint: GET /tasks/range?householdId=...&from=...&to=...
   * Rückgabe: { tasks: Task[], occurrenceStatuses: OccStatus[] }
   */
  listRange({ householdId, from, to }) {
    const query = qs({ householdId, from, to });
    return apiClient(`/tasks/range?${query}`, { method: "GET" });
  },

  createTask(dto) {
    return apiClient(`/tasks`, { method: "POST", body: dto });
  },

  setTaskStatus(taskId, status) {
    return apiClient(`/tasks/${encodeURIComponent(taskId)}/status`, {
      method: "PATCH",
      body: { status }
    });
  },

  setOccurrenceStatus(taskId, occurrenceAt, status) {
    return apiClient(`/tasks/${encodeURIComponent(taskId)}/occurrence`, {
      method: "PATCH",
      body: { occurrenceAt, status }
    });
  },

  deleteTask(taskId) {
    return apiClient(`/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
  }
};
