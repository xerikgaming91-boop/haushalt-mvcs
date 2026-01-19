import { useCallback, useEffect, useMemo, useState } from "react";
import { householdsService } from "../services/households.service.js";
import { categoriesService } from "../services/categories.service.js";
import { tasksService } from "../services/tasks.service.js";

export function useDashboardController(me) {
  const [households, setHouseholds] = useState([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState("");
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  const activeHousehold = useMemo(() => households.find((h) => h.id === activeHouseholdId) || null, [households, activeHouseholdId]);

  const loadHouseholds = useCallback(async () => {
    setError("");
    const data = await householdsService.list();
    setHouseholds(data.households);
    if (!activeHouseholdId && data.households.length) setActiveHouseholdId(data.households[0].id);
  }, [activeHouseholdId]);

  const loadContext = useCallback(async (householdId) => {
    if (!householdId) return;
    setError("");
    const [m, c, t] = await Promise.all([
      householdsService.members(householdId),
      categoriesService.list(householdId),
      tasksService.list(householdId)
    ]);
    setMembers(m.members);
    setCategories(c.categories);
    setTasks(t.tasks);
  }, []);

  useEffect(() => {
    if (!me) return;
    loadHouseholds().catch((e) => setError(e.message));
  }, [me, loadHouseholds]);

  useEffect(() => {
    if (!me) return;
    if (!activeHouseholdId) return;
    loadContext(activeHouseholdId).catch((e) => setError(e.message));
  }, [me, activeHouseholdId, loadContext]);

  const createHousehold = useCallback(async (name) => {
    setError("");
    const data = await householdsService.create({ name: name });
    await loadHouseholds();
    setActiveHouseholdId(data.household.id);
    return data.household;
  }, [loadHouseholds]);

  const createInvite = useCallback(async (email) => {
    if (!activeHouseholdId) throw new Error("Kein Haushalt ausgewählt.");
    const dto = email && email.trim() ? { email: email.trim() } : {};
    return householdsService.createInvite(activeHouseholdId, dto);
  }, [activeHouseholdId]);

  const createCategory = useCallback(async (dto) => {
    if (!activeHouseholdId) throw new Error("Kein Haushalt ausgewählt.");
    await categoriesService.create(activeHouseholdId, dto);
    await loadContext(activeHouseholdId);
  }, [activeHouseholdId, loadContext]);

  const createTask = useCallback(async (dto) => {
    if (!activeHouseholdId) throw new Error("Kein Haushalt ausgewählt.");
    await tasksService.create(activeHouseholdId, dto);
    await loadContext(activeHouseholdId);
  }, [activeHouseholdId, loadContext]);

  const toggleTaskDone = useCallback(async (taskId, currentStatus) => {
    await tasksService.update(taskId, { status: currentStatus === "DONE" ? "OPEN" : "DONE" });
    if (activeHouseholdId) await loadContext(activeHouseholdId);
  }, [activeHouseholdId, loadContext]);

  const deleteTask = useCallback(async (taskId) => {
    await tasksService.remove(taskId);
    if (activeHouseholdId) await loadContext(activeHouseholdId);
  }, [activeHouseholdId, loadContext]);

  return {
    households, activeHouseholdId, setActiveHouseholdId, activeHousehold,
    members, categories, tasks, error,
    createHousehold, createInvite, createCategory, createTask, toggleTaskDone, deleteTask
  };
}
