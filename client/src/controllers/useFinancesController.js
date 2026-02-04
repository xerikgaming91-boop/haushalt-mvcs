// client/src/controllers/useFinancesController.js

import { useCallback, useEffect, useMemo, useState } from "react";
import { financesStorageService } from "../services/financesStorage.service.js";

function monthKeyFromDate(d = new Date()) {
  const iso = new Date(d).toISOString().slice(0, 10);
  return iso.slice(0, 7); // YYYY-MM
}

function monthRange(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return {
    startISO: start.toISOString().slice(0, 10),
    endISO: end.toISOString().slice(0, 10),
    year: y,
    month: m,
  };
}

function isoToUtcDate(iso) {
  return new Date(`${iso}T00:00:00.000Z`);
}

function utcDateToISO(d) {
  return d.toISOString().slice(0, 10);
}

function daysInMonthUTC(year, month1to12) {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

function signedCentsFromType(type, amountCents) {
  const c = Math.abs(amountCents || 0);
  return type === "EXPENSE" ? -c : c;
}

function addDaysUTC(d, days) {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function addMonthsUTC(d, months) {
  const out = new Date(d.getTime());
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
}

function generateOccurrences(series, fromISO, toISO) {
  // returns occurrences in [fromISO, toISO) by ISO date
  const out = [];
  const from = isoToUtcDate(fromISO);
  const to = isoToUtcDate(toISO);

  const start = isoToUtcDate(series.startDate);
  const end = series.endDate ? isoToUtcDate(series.endDate) : null;

  const rule = series.rule || { freq: "MONTHLY", interval: 1 };
  const interval = Math.max(1, Number(rule.interval || 1));
  const freq = String(rule.freq || "MONTHLY").toUpperCase();

  if (freq === "MONTHLY") {
    const dayOfMonth = Math.min(31, Math.max(1, Number(rule.dayOfMonth || start.getUTCDate())));
    // start at month of max(start, from)
    const anchor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const begin = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));

    // find first month >= anchor that is also >= begin and aligns by interval from anchor
    let cur = begin;
    while (cur < anchor) cur = addMonthsUTC(cur, 1);

    const monthsBetween = (cur.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (cur.getUTCMonth() - anchor.getUTCMonth());
    const offset = ((monthsBetween % interval) + interval) % interval;
    if (offset !== 0) cur = addMonthsUTC(cur, interval - offset);

    while (cur < to) {
      const y = cur.getUTCFullYear();
      const m = cur.getUTCMonth() + 1;
      const dim = daysInMonthUTC(y, m);
      const d = Math.min(dayOfMonth, dim);

      const occ = new Date(Date.UTC(y, m - 1, d));
      const occISO = utcDateToISO(occ);

      if (occ >= start && occ >= from && occ < to) {
        if (!end || occ <= end) out.push(occISO);
      }
      cur = addMonthsUTC(cur, interval);
    }
  }

  if (freq === "WEEKLY") {
    const weekday = Number.isFinite(Number(rule.weekday)) ? Number(rule.weekday) : start.getUTCDay();
    const base = start;

    // find first occurrence >= from that matches weekday and >= start
    let cur = new Date(Math.max(base.getTime(), from.getTime()));
    // move to desired weekday
    while (cur.getUTCDay() !== weekday) cur = addDaysUTC(cur, 1);

    // align to interval weeks from base
    const daysDiff = Math.floor((cur.getTime() - base.getTime()) / (24 * 3600 * 1000));
    const weeksDiff = Math.floor(daysDiff / 7);
    const offset = ((weeksDiff % interval) + interval) % interval;
    if (offset !== 0) cur = addDaysUTC(cur, (interval - offset) * 7);

    while (cur < to) {
      if (cur >= start && cur >= from && cur < to) {
        if (!end || cur <= end) out.push(utcDateToISO(cur));
      }
      cur = addDaysUTC(cur, interval * 7);
    }
  }

  if (freq === "YEARLY") {
    const month = Math.min(12, Math.max(1, Number(rule.month || (start.getUTCMonth() + 1))));
    const dayOfMonth = Math.min(31, Math.max(1, Number(rule.dayOfMonth || start.getUTCDate())));

    // iterate years covering range
    const yStart = isoToUtcDate(fromISO).getUTCFullYear();
    const yEnd = isoToUtcDate(toISO).getUTCFullYear() + 1;

    for (let y = yStart; y <= yEnd; y += Math.max(1, interval)) {
      const dim = daysInMonthUTC(y, month);
      const d = Math.min(dayOfMonth, dim);
      const occ = new Date(Date.UTC(y, month - 1, d));
      const occISO = utcDateToISO(occ);

      if (occ >= start && occ >= from && occ < to) {
        if (!end || occ <= end) out.push(occISO);
      }
    }
  }

  return out;
}

function applyException(base, ex) {
  if (!ex) return base;
  if (ex.kind === "SKIP") return null;

  if (ex.kind === "OVERRIDE") {
    const o = ex.override || {};
    return {
      ...base,
      title: o.title ?? base.title,
      note: o.note ?? base.note,
      type: o.type ?? base.type,
      amountCents: typeof o.amountCents === "number" ? Math.abs(o.amountCents) : base.amountCents,
      exceptionKind: "OVERRIDE",
    };
  }

  return base;
}

function formatEuro(cents) {
  const n = (cents || 0) / 100;
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export function useFinancesController(activeHouseholdId) {
  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate(new Date()));
  const [entries, setEntries] = useState([]);
  const [series, setSeries] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [meta, setMetaState] = useState({ startBalanceCents: 0 });

  const canUse = Boolean(activeHouseholdId);

  useEffect(() => {
    if (!activeHouseholdId) return;
    setMetaState(financesStorageService.getMeta(activeHouseholdId));
    setEntries(financesStorageService.listEntries(activeHouseholdId));
    setSeries(financesStorageService.listSeries(activeHouseholdId));
    setExceptions(financesStorageService.listExceptions(activeHouseholdId));
  }, [activeHouseholdId]);

  const range = useMemo(() => monthRange(monthKey), [monthKey]);

  const exceptionsMap = useMemo(() => {
    const m = new Map();
    for (const ex of exceptions) m.set(ex.id, ex);
    return m;
  }, [exceptions]);

  const monthOneOff = useMemo(() => {
    return entries.filter((e) => e.date >= range.startISO && e.date < range.endISO);
  }, [entries, range.startISO, range.endISO]);

  const monthSeriesOccurrences = useMemo(() => {
    const out = [];
    for (const s of series) {
      const dates = generateOccurrences(s, range.startISO, range.endISO);
      for (const date of dates) {
        const ex = exceptionsMap.get(`${s.id}:${date}`);
        const base = {
          id: `__ser:${s.id}:${date}`,
          source: "SERIES",
          seriesId: s.id,
          date,
          title: s.title,
          note: s.note || "",
          type: s.type,
          amountCents: s.amountCents,
          exceptionKind: ex?.kind || null,
        };
        const applied = applyException(base, ex);
        if (applied) out.push(applied);
      }
    }
    out.sort((a, b) => a.date.localeCompare(b.date));
    return out;
  }, [series, range.startISO, range.endISO, exceptionsMap]);

  const carryCents = useMemo(() => {
    if (!activeHouseholdId) return 0;

    // One-off before month start
    const beforeOneOff = entries.filter((e) => e.date < range.startISO);
    let sum = beforeOneOff.reduce((acc, e) => acc + signedCentsFromType(e.type, e.amountCents), 0);

    // Series occurrences before month start (from startDate to range.startISO)
    for (const s of series) {
      const dates = generateOccurrences(s, s.startDate, range.startISO);
      for (const date of dates) {
        const ex = exceptionsMap.get(`${s.id}:${date}`);
        const base = {
          seriesId: s.id,
          date,
          title: s.title,
          note: s.note || "",
          type: s.type,
          amountCents: s.amountCents,
        };
        const applied = applyException(base, ex);
        if (!applied) continue;
        sum += signedCentsFromType(applied.type, applied.amountCents);
      }
    }

    return (meta.startBalanceCents || 0) + sum;
  }, [activeHouseholdId, entries, series, exceptionsMap, meta.startBalanceCents, range.startISO]);

  const carryEntry = useMemo(() => {
    return {
      id: "__carry__",
      source: "CARRY",
      date: range.startISO,
      title: "Übertrag Vormonat",
      note: "Automatisch (nicht gespeichert)",
      type: "INCOME",
      amountCents: Math.abs(carryCents),
      signedCents: carryCents,
      locked: true,
    };
  }, [range.startISO, carryCents]);

  const monthAll = useMemo(() => {
    const oneOffRows = monthOneOff.map((e) => ({
      id: e.id,
      source: "ENTRY",
      date: e.date,
      title: e.title,
      note: e.note || "",
      type: e.type,
      amountCents: e.amountCents,
    }));

    const all = [...oneOffRows, ...monthSeriesOccurrences];
    all.sort((a, b) => a.date.localeCompare(b.date));
    return all;
  }, [monthOneOff, monthSeriesOccurrences]);

  const totals = useMemo(() => {
    const income = monthAll
      .filter((e) => e.type === "INCOME")
      .reduce((a, e) => a + (e.amountCents || 0), 0);

    const expense = monthAll
      .filter((e) => e.type === "EXPENSE")
      .reduce((a, e) => a + (e.amountCents || 0), 0);

    const end = carryCents + income - expense;

    return {
      start: carryCents,
      income,
      expense,
      end,
      startLabel: formatEuro(carryCents),
      incomeLabel: formatEuro(income),
      expenseLabel: formatEuro(-expense),
      endLabel: formatEuro(end),
    };
  }, [monthAll, carryCents]);

  const dailySeries = useMemo(() => {
    const days = daysInMonthUTC(range.year, range.month);

    const byDay = new Map();
    for (const e of monthAll) {
      const day = Number(e.date.slice(8, 10));
      byDay.set(day, (byDay.get(day) || 0) + signedCentsFromType(e.type, e.amountCents));
    }

    const out = [];
    let running = carryCents;
    for (let day = 1; day <= days; day++) {
      running += byDay.get(day) || 0;
      out.push({
        day,
        label: `${String(day).padStart(2, "0")}.${String(range.month).padStart(2, "0")}.${range.year}`,
        availableCents: running,
      });
    }
    return out;
  }, [monthAll, carryCents, range.year, range.month]);

  // -------- meta ----------
  const setStartBalanceEuro = useCallback(
    (euroValue) => {
      if (!activeHouseholdId) return;
      const cents = financesStorageService.parseMoneyToCents(euroValue);
      const next = financesStorageService.setMeta(activeHouseholdId, { startBalanceCents: cents });
      setMetaState(next);
    },
    [activeHouseholdId]
  );

  // -------- entries ----------
  const addEntry = useCallback(
    (payload) => {
      if (!activeHouseholdId) return;
      const saved = financesStorageService.upsertEntry(activeHouseholdId, payload);
      setEntries(financesStorageService.listEntries(activeHouseholdId));
      return saved;
    },
    [activeHouseholdId]
  );

  const updateEntry = useCallback(
    (entryId, patch) => {
      if (!activeHouseholdId) return;
      const current = entries.find((e) => e.id === entryId);
      if (!current) return;
      const saved = financesStorageService.upsertEntry(activeHouseholdId, { ...current, ...patch });
      setEntries(financesStorageService.listEntries(activeHouseholdId));
      return saved;
    },
    [activeHouseholdId, entries]
  );

  const deleteEntry = useCallback(
    (entryId) => {
      if (!activeHouseholdId) return;
      financesStorageService.deleteEntry(activeHouseholdId, entryId);
      setEntries(financesStorageService.listEntries(activeHouseholdId));
    },
    [activeHouseholdId]
  );

  // -------- series ----------
  const addSeries = useCallback(
    (payload) => {
      if (!activeHouseholdId) return;
      const saved = financesStorageService.upsertSeries(activeHouseholdId, payload);
      setSeries(financesStorageService.listSeries(activeHouseholdId));
      return saved;
    },
    [activeHouseholdId]
  );

  const updateSeries = useCallback(
    (seriesId, patch) => {
      if (!activeHouseholdId) return;
      const current = series.find((s) => s.id === seriesId);
      if (!current) return;
      const saved = financesStorageService.upsertSeries(activeHouseholdId, { ...current, ...patch });
      setSeries(financesStorageService.listSeries(activeHouseholdId));
      return saved;
    },
    [activeHouseholdId, series]
  );

  const deleteSeries = useCallback(
    (seriesId) => {
      if (!activeHouseholdId) return;
      financesStorageService.deleteSeries(activeHouseholdId, seriesId);
      setSeries(financesStorageService.listSeries(activeHouseholdId));
      setExceptions(financesStorageService.listExceptions(activeHouseholdId));
    },
    [activeHouseholdId]
  );

  // -------- exceptions ----------
  const skipOccurrence = useCallback(
    (seriesId, dateISO) => {
      if (!activeHouseholdId) return;
      financesStorageService.upsertException(activeHouseholdId, {
        id: `${seriesId}:${dateISO}`,
        seriesId,
        date: dateISO,
        kind: "SKIP",
      });
      setExceptions(financesStorageService.listExceptions(activeHouseholdId));
    },
    [activeHouseholdId]
  );

  const overrideOccurrence = useCallback(
    (seriesId, dateISO, override) => {
      if (!activeHouseholdId) return;
      financesStorageService.upsertException(activeHouseholdId, {
        id: `${seriesId}:${dateISO}`,
        seriesId,
        date: dateISO,
        kind: "OVERRIDE",
        override,
      });
      setExceptions(financesStorageService.listExceptions(activeHouseholdId));
    },
    [activeHouseholdId]
  );

  const clearException = useCallback(
    (seriesId, dateISO) => {
      if (!activeHouseholdId) return;
      financesStorageService.deleteException(activeHouseholdId, seriesId, dateISO);
      setExceptions(financesStorageService.listExceptions(activeHouseholdId));
    },
    [activeHouseholdId]
  );

  return {
    canUse,

    monthKey,
    setMonthKey,

    meta,
    setStartBalanceEuro,

    entries,
    series,
    exceptions,

    carryEntry,
    monthAll,
    totals,
    dailySeries,

    addEntry,
    updateEntry,
    deleteEntry,

    addSeries,
    updateSeries,
    deleteSeries,

    skipOccurrence,
    overrideOccurrence,
    clearException,
  };
}
