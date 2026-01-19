import { useCallback, useEffect, useMemo, useState } from "react";
import { tasksService } from "../services/tasks.service.js";
import { expandTasksToOccurrences, isRecurringTask, localDateKey } from "../lib/recurrence.js";

export function useTaskRangeController(activeHouseholdId, fromDate, toDate) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [baseTasks, setBaseTasks] = useState([]);
  const [occurrences, setOccurrences] = useState([]);

  const fromIso = useMemo(() => fromDate?.toISOString() || "", [fromDate]);
  const toIso = useMemo(() => toDate?.toISOString() || "", [toDate]);

  const applyOccurrenceStatuses = useCallback((expanded, occurrenceStatuses) => {
    const map = new Map(); // key: taskId:occurrenceAtIso -> status
    for (const os of occurrenceStatuses || []) {
      const key = `${os.taskId}:${new Date(os.occurrenceAt).toISOString()}`;
      map.set(key, os.status);
    }

    return expanded.map((o) => {
      const recurring = isRecurringTask(o.baseTask);
      if (!recurring) {
        return { ...o, status: o.baseTask.status || "OPEN" };
      }

      const key = `${o.taskId}:${new Date(o.dueAt).toISOString()}`;
      const status = map.get(key) || "OPEN";
      return { ...o, status };
    });
  }, []);

  const reload = useCallback(async () => {
    if (!activeHouseholdId || !fromIso || !toIso) {
      setBaseTasks([]);
      setOccurrences([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const r = await tasksService.listRange({
        householdId: activeHouseholdId,
        from: fromIso,
        to: toIso
      });

      const tasks = r.tasks || [];
      const expanded = expandTasksToOccurrences(tasks, new Date(fromIso), new Date(toIso));
      const merged = applyOccurrenceStatuses(expanded, r.occurrenceStatuses || []);

      setBaseTasks(tasks);
      setOccurrences(merged);
    } catch (e) {
      setError(e.message);
      setBaseTasks([]);
      setOccurrences([]);
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId, fromIso, toIso, applyOccurrenceStatuses]);

  useEffect(() => {
    reload();
  }, [reload]);

  const statsByDay = useMemo(() => {
    const m = new Map(); // dateKey -> { open, done, total }
    for (const o of occurrences) {
      const k = localDateKey(o.dueAt);
      const s = m.get(k) || { open: 0, done: 0, total: 0 };
      s.total += 1;
      if (o.status === "DONE") s.done += 1;
      else s.open += 1;
      m.set(k, s);
    }
    return m;
  }, [occurrences]);

  const setOccurrenceStatus = useCallback(
    async (occurrence, nextStatus) => {
      setError("");
      try {
        const recurring = isRecurringTask(occurrence.baseTask);
        if (recurring) {
          await tasksService.setOccurrenceStatus(occurrence.taskId, occurrence.dueAt, nextStatus);
        } else {
          await tasksService.setTaskStatus(occurrence.taskId, nextStatus);
        }
        await reload();
      } catch (e) {
        setError(e.message);
      }
    },
    [reload]
  );

  const toggleOccurrence = useCallback(
    async (occurrence) => {
      const next = occurrence.status === "DONE" ? "OPEN" : "DONE";
      await setOccurrenceStatus(occurrence, next);
    },
    [setOccurrenceStatus]
  );

  const createTask = useCallback(
    async (dto) => {
      setError("");
      try {
        await tasksService.createTask(dto);
        await reload();
        return { ok: true };
      } catch (e) {
        setError(e.message);
        throw e;
      }
    },
    [reload]
  );

  const deleteTask = useCallback(
    async (taskId) => {
      setError("");
      try {
        await tasksService.deleteTask(taskId);
        await reload();
      } catch (e) {
        setError(e.message);
      }
    },
    [reload]
  );

  return {
    loading,
    error,
    baseTasks,
    occurrences,
    statsByDay,
    reload,
    toggleOccurrence,
    setOccurrenceStatus,
    createTask,
    deleteTask
  };
}
