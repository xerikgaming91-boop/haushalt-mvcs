import React, { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useTaskRangeController } from "../../controllers/useTaskRangeController.js";
import { localDateKey } from "../../lib/recurrence.js";

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function monthRange(activeStartDate) {
  const start = new Date(activeStartDate);
  start.setHours(0, 0, 0, 0);

  const from = new Date(start);
  from.setDate(from.getDate() - 7);

  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  const to = new Date(end);
  to.setDate(to.getDate() + 7);

  return { from, to };
}

// Monday-first index (Mo=0..So=6)
function mondayIndex(jsDay) {
  return (jsDay + 6) % 7;
}

function startOfCalendarGrid(monthStart) {
  const s = new Date(monthStart);
  const offset = mondayIndex(s.getDay());
  s.setDate(s.getDate() - offset);
  s.setHours(0, 0, 0, 0);
  return s;
}

function endOfCalendarGrid(monthStart) {
  const last = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  last.setHours(0, 0, 0, 0);
  const offset = 6 - mondayIndex(last.getDay());
  last.setDate(last.getDate() + offset);
  last.setHours(0, 0, 0, 0);
  return last;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function initialsFromName(name) {
  const s = (name || "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || parts[0]?.[1] || "";
  return (a + b).toUpperCase();
}

export function CalendarPage() {
  const d = useDashboard();

  const [activeStartDate, setActiveStartDate] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => {
    const x = new Date();
    x.setHours(0, 0, 0, 0);
    return x;
  });

  const range = useMemo(() => monthRange(activeStartDate), [activeStartDate]);
  const tc = useTaskRangeController(d.activeHouseholdId, range.from, range.to);

  const monthLabel = useMemo(() => {
    const s = activeStartDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [activeStartDate]);

  const selectedKey = useMemo(() => localDateKey(selectedDay), [selectedDay]);

  const gridDays = useMemo(() => {
    const start = startOfCalendarGrid(activeStartDate);
    const end = endOfCalendarGrid(activeStartDate);

    const days = [];
    const cur = new Date(start);
    while (cur <= end) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [activeStartDate]);

  const onPrevMonth = useCallback(() => {
    setActiveStartDate((cur) => startOfMonth(new Date(cur.getFullYear(), cur.getMonth() - 1, 1)));
  }, []);

  const onNextMonth = useCallback(() => {
    setActiveStartDate((cur) => startOfMonth(new Date(cur.getFullYear(), cur.getMonth() + 1, 1)));
  }, []);

  const onSelectDay = useCallback(
    (day) => {
      const x = new Date(day);
      x.setHours(0, 0, 0, 0);
      setSelectedDay(x);

      // Wenn du auf einen Tag aus dem “grauen” Bereich klickst: in den Monat wechseln
      if (x.getFullYear() !== activeStartDate.getFullYear() || x.getMonth() !== activeStartDate.getMonth()) {
        setActiveStartDate(startOfMonth(x));
      }
    },
    [activeStartDate]
  );

  const dayTasks = useMemo(() => {
    const list = (tc.occurrences || []).filter((o) => localDateKey(o.dueAt) === selectedKey);
    return list.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [tc.occurrences, selectedKey]);

  const today = useMemo(() => {
    const x = new Date();
    x.setHours(0, 0, 0, 0);
    return x;
  }, []);

  const dayStats = useMemo(
    () => tc.statsByDay.get(selectedKey) || { open: 0, done: 0, total: 0 },
    [tc.statsByDay, selectedKey]
  );

  if (!d.activeHousehold) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white">Kalender</h2>
        <p className="mt-2 text-sm text-slate-400">
          Bitte zuerst einen Haushalt auswählen/erstellen unter{" "}
          <Link className="text-sky-300 hover:text-sky-200" to="/household">
            Haushalt
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(d.error || tc.error) && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {tc.error || d.error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Kalender</h2>
            <p className="mt-1 text-sm text-slate-400">
              Aktiver Haushalt:{" "}
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-200">
                {d.activeHousehold.name}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevMonth}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 p-2 text-slate-200 hover:bg-white/5"
              aria-label="Vorheriger Monat"
              title="Vorheriger Monat"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            <div className="min-w-50 text-center text-sm font-semibold text-white">{monthLabel}</div>

            <button
              type="button"
              onClick={onNextMonth}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 p-2 text-slate-200 hover:bg-white/5"
              aria-label="Nächster Monat"
              title="Nächster Monat"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-6">
          {/* Borderless stacked calendar */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-semibold text-slate-400">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((w) => (
                <div key={w} className="py-2">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2 text-center">
              {gridDays.map((day) => {
                const inMonth =
                  day.getFullYear() === activeStartDate.getFullYear() &&
                  day.getMonth() === activeStartDate.getMonth();

                const isSelected = sameDay(day, selectedDay);
                const isToday = sameDay(day, today);

                const k = localDateKey(day);
                const s = tc.statsByDay.get(k) || { open: 0, done: 0, total: 0 };

                const baseBtn =
                  "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition";
                const stateCls = isSelected
                  ? "bg-sky-600 text-white"
                  : inMonth
                  ? "text-slate-200 hover:bg-white/5"
                  : "text-slate-600 hover:bg-white/5";

                const todayRing = isToday && !isSelected ? "ring-2 ring-sky-500/60 ring-offset-0" : "";

                return (
                  <div key={k} className="px-1">
                    <button
                      type="button"
                      onClick={() => onSelectDay(day)}
                      className={`${baseBtn} ${stateCls} ${todayRing}`}
                      aria-label={day.toLocaleDateString("de-DE")}
                    >
                      {day.getDate()}
                    </button>

                    {/* Indicators (open/done counts) */}
                    {s.total > 0 ? (
                      <div className="mt-1 flex items-center justify-center gap-1 text-[10px]">
                        {s.open > 0 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-sky-400/15 px-1.5 py-0.5 text-sky-200"
                            title={`Offen: ${s.open}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                            {s.open}
                          </span>
                        )}
                        {s.done > 0 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-emerald-200"
                            title={`Erledigt: ${s.done}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {s.done}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 h-4.5" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Offen
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Erledigt
                </span>
              </div>

              <div>
                Aufgaben erstellen unter{" "}
                <Link className="text-sky-300 hover:text-sky-200" to="/tasks">
                  Aufgaben
                </Link>
                .
              </div>
            </div>
          </div>

          {/* Tasks below calendar */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Aufgaben für {selectedDay.toLocaleDateString("de-DE")}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Gesamt: {dayStats.total} · Offen: {dayStats.open} · Erledigt: {dayStats.done}
                </p>
              </div>

              <Link
                to="/tasks"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
              >
                Zu Aufgaben
              </Link>
            </div>

            <div className="mt-4">
              {tc.loading ? (
                <p className="text-sm text-slate-400">Lade…</p>
              ) : dayTasks.length === 0 ? (
                <p className="text-sm text-slate-400">Keine Aufgaben.</p>
              ) : (
                <ul role="list" className="divide-y divide-white/10">
                  {dayTasks.map((o) => {
                    const assignee = o.assignedTo?.name || "";
                    const time = new Date(o.dueAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    const statusIsDone = o.status === "DONE";

                    return (
                      <li key={o.key} className="flex items-start justify-between gap-3 py-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
                            {initialsFromName(assignee)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{o.title}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {time}
                              {" · "}
                              {o.assignedTo ? o.assignedTo.name : "—"}
                              {" · "}
                              {o.category ? o.category.name : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={
                              "inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold " +
                              (statusIsDone
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                                : "border-sky-500/30 bg-sky-500/10 text-sky-100")
                            }
                          >
                            {statusIsDone ? "Erledigt" : "Offen"}
                          </span>

                          <button
                            type="button"
                            onClick={() => tc.toggleOccurrence(o)}
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
                          >
                            {statusIsDone ? "Reopen" : "Done"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
