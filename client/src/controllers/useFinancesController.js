// client/src/controllers/useFinancesController.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { financesService } from "../services/finances.service.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function rangeForMonth(date) {
  const d = new Date(date);
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const fromIso = `${from.getFullYear()}-${pad2(from.getMonth() + 1)}-${pad2(from.getDate())}`;
  const toIso = `${to.getFullYear()}-${pad2(to.getMonth() + 1)}-${pad2(to.getDate())}`;
  return { from: fromIso, to: toIso };
}

function signedCents(item) {
  const v = Number(item?.amountCents || 0);
  return item?.type === "EXPENSE" ? -v : v;
}

export function useFinancesController(activeHouseholdId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [month, setMonth] = useState(() => new Date());
  const [items, setItems] = useState([]);

  const monthLabel = useMemo(() => monthKey(month), [month]);
  const { from, to } = useMemo(() => rangeForMonth(month), [month]);

  const reload = useCallback(async () => {
    if (!activeHouseholdId) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1) Current month items (includes expanded recurring occurrences)
      const cur = await financesService.list({ householdId: activeHouseholdId, from, to });
      const curItems = cur.items || [];

      // 2) Compute "carry" = running balance until end of previous month
      const prevMonth = new Date(month);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevRange = rangeForMonth(prevMonth);

      // take ALL entries until prevTo to compute running balance
      const allUntilPrev = await financesService.list({
        householdId: activeHouseholdId,
        from: "1970-01-01",
        to: prevRange.to,
      });

      const carrySigned = (allUntilPrev.items || []).reduce((sum, it) => sum + signedCents(it), 0);

      let carryItem = null;
      if (carrySigned !== 0) {
        carryItem = {
          id: `__carry__${monthLabel}`,
          baseId: `__carry__${monthLabel}`,
          isAuto: true,
          isRecurring: false,
          seriesStartDate: null,
          date: from, // first day of current month
          type: carrySigned >= 0 ? "INCOME" : "EXPENSE",
          title: "Übertrag Vormonat",
          note: "Automatisch berechnet (Kontostand bis Ende Vormonat).",
          amountCents: Math.abs(carrySigned),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          recurrence: { type: "NONE" },
        };
      }

      // 3) Items for UI: pin carry at top so it's visible
      setItems(carryItem ? [carryItem, ...curItems] : curItems);
    } catch (e) {
      setError(e?.message || "Finanzen laden fehlgeschlagen.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId, from, to, month, monthLabel]);

  useEffect(() => {
    reload();
  }, [reload]);

  const incomeCents = useMemo(
    () => items.filter((i) => i.type === "INCOME").reduce((sum, i) => sum + (i.amountCents || 0), 0),
    [items]
  );

  const expenseCents = useMemo(
    () => items.filter((i) => i.type === "EXPENSE").reduce((sum, i) => sum + (i.amountCents || 0), 0),
    [items]
  );

  const netCents = useMemo(() => incomeCents - expenseCents, [incomeCents, expenseCents]);

  const createEntry = useCallback(
    async (dto) => {
      if (!activeHouseholdId) throw new Error("Kein Haushalt ausgewählt.");
      setError("");
      await financesService.create({ ...dto, householdId: activeHouseholdId });
      await reload();
    },
    [activeHouseholdId, reload]
  );

  const updateEntry = useCallback(
    async (baseId, patch) => {
      if (!activeHouseholdId) throw new Error("Kein Haushalt ausgewählt.");
      setError("");
      await financesService.update(activeHouseholdId, baseId, patch);
      await reload();
    },
    [activeHouseholdId, reload]
  );

  const removeEntry = useCallback(
    async (baseId) => {
      if (!activeHouseholdId) throw new Error("Kein Haushalt ausgewählt.");
      setError("");
      await financesService.remove(activeHouseholdId, baseId);
      await reload();
    },
    [activeHouseholdId, reload]
  );

  const prevMonth = useCallback(() => {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    setMonth(d);
  }, [month]);

  const nextMonth = useCallback(() => {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    setMonth(d);
  }, [month]);

  return {
    loading,
    error,
    month,
    monthLabel,
    setMonth,
    from,
    to,
    items,
    incomeCents,
    expenseCents,
    netCents,
    reload,
    prevMonth,
    nextMonth,
    createEntry,
    updateEntry,
    removeEntry,
  };
}

export default useFinancesController;
