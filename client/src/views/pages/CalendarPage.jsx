import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useTaskRangeController } from "../../controllers/useTaskRangeController.js";
import { localDateKey } from "../../lib/recurrence.js";

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// Monday-based week (Mo=0 … So=6)
function weekdayMon0(d) {
  return (d.getDay() + 6) % 7;
}

function startOfCalendarGrid(viewMonthDate) {
  const first = new Date(viewMonthDate.getFullYear(), viewMonthDate.getMonth(), 1);
  const offset = weekdayMon0(first);
  return startOfDay(addDays(first, -offset));
}

function buildCalendarDays(viewMonthDate) {
  const start = startOfCalendarGrid(viewMonthDate);
  const days = [];
  for (let i = 0; i < 42; i++) days.push(addDays(start, i));
  return days;
}

function sameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthTitle(d) {
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

function timeHHMM(dateLike) {
  const d = new Date(dateLike);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export function CalendarPage() {
  const d = useDashboard();
  const navigate = useNavigate();

  const [viewMonthDate, setViewMonthDate] = useState(() => {
    const x = new Date();
    x.setDate(1);
    x.setHours(0, 0, 0, 0);
    return x;
  });

  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));

  const days = useMemo(() => buildCalendarDays(viewMonthDate), [viewMonthDate]);

  const rangeFrom = useMemo(() => startOfDay(days[0]), [days]);
  const rangeTo = useMemo(() => endOfDay(days[days.length - 1]), [days]);

  const tc = useTaskRangeController(d.activeHouseholdId, rangeFrom, rangeTo);

  const selectedKey = useMemo(() => localDateKey(selectedDay), [selectedDay]);

  const dayTasks = useMemo(() => {
    return (tc.occurrences || [])
      .filter((o) => localDateKey(o.dueAt) === selectedKey)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [tc.occurrences, selectedKey]);

  if (!d.activeHousehold) {
    return (
      <div className="ui-card">
        <h2 className="text-lg font-semibold">Kalender</h2>
        <p className="mt-1 text-sm text-slate-400">
          Bitte zuerst einen Haushalt auswählen/erstellen unter{" "}
          <Link to="/household">Haushalt</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="ui-card space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Kalender</h2>
          <div className="mt-1 text-sm text-slate-400">
            Aktiver Haushalt: <span className="ui-pill">{d.activeHousehold.name}</span>
          </div>
        </div>

        <button type="button" className="ui-btn-primary" onClick={() => navigate("/tasks")}>
          Aufgaben verwalten
        </button>
      </div>

      {(d.error || tc.error) && (
        <div className="rounded-2xl border border-red-500/60 bg-red-500/10 p-4 text-sm">
          {tc.error || d.error}
        </div>
      )}

      {/* Tailwind Calendar (Borderless stacked style) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="ui-btn"
              aria-label="Vorheriger Monat"
              onClick={() => setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            >
              ‹
            </button>

            <h3 className="text-sm font-semibold text-slate-200">
              {formatMonthTitle(viewMonthDate)}
            </h3>

            <button
              type="button"
              className="ui-btn"
              aria-label="Nächster Monat"
              onClick={() => setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>

          <div className="mt-6 grid grid-cols-7 text-center text-xs leading-6 text-slate-400">
            <div>M</div>
            <div>D</div>
            <div>M</div>
            <div>D</div>
            <div>F</div>
            <div>S</div>
            <div>S</div>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-y-2 text-sm">
            {days.map((day) => {
              const inMonth = day.getMonth() === viewMonthDate.getMonth();
              const isSelected = sameDate(day, selectedDay);
              const key = localDateKey(day);
              const stats = tc.statsByDay?.get(key);

              const hasOpen = !!stats?.open;
              const hasDone = !!stats?.done;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    setSelectedDay(startOfDay(day));
                    // Wenn man einen Tag aus dem angrenzenden Monat klickt: Monatsview mitziehen
                    if (!inMonth) setViewMonthDate(new Date(day.getFullYear(), day.getMonth(), 1));
                  }}
                  className={[
                    "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full transition",
                    isSelected
                      ? "bg-white text-slate-900"
                      : "hover:bg-slate-900/40",
                    inMonth ? "text-slate-200" : "text-slate-500"
                  ].join(" ")}
                >
                  <time dateTime={day.toISOString()}>{day.getDate()}</time>

                  {(hasOpen || hasDone) && (
                    <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
                      {hasOpen && <span className="h-1 w-1 rounded-full bg-blue-400" />}
                      {hasDone && <span className="h-1 w-1 rounded-full bg-emerald-400" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Offen
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Erledigt
            </div>
          </div>
        </div>

        {/* Schedule list under calendar (like screenshot) */}
        <div className="mx-auto mt-10 max-w-md">
          <h3 className="text-sm font-semibold text-slate-200">
            Aufgaben für {selectedDay.toLocaleDateString()}
          </h3>

          <div className="mt-4">
            {tc.loading ? (
              <div className="text-sm text-slate-400">Lade…</div>
            ) : dayTasks.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-4 text-sm text-slate-400">
                Keine Aufgaben an diesem Tag. Erstellen kannst du Aufgaben unter{" "}
                <Link to="/tasks">Aufgaben</Link>.
              </div>
            ) : (
              <ol className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-950/20">
                {dayTasks.map((o) => {
                  const assignee = o.assignedTo?.name || "Unzugewiesen";
                  const when = timeHHMM(o.dueAt);

                  return (
                    <li key={o.key} className="flex items-center gap-4 px-4 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/60 ring-1 ring-slate-700">
                        <span className="text-sm font-semibold text-slate-200">
                          {initials(assignee)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-200">
                          {o.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span>{assignee}</span>
                          <span aria-hidden="true">·</span>
                          <span>{when}</span>
                          {o.category?.name && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{o.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "rounded-full border px-2.5 py-0.5 text-xs",
                            o.status === "DONE"
                              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                              : "border-blue-500/60 bg-blue-500/10 text-blue-200"
                          ].join(" ")}
                        >
                          {o.status === "DONE" ? "Erledigt" : "Offen"}
                        </span>

                        <button type="button" className="ui-btn" onClick={() => tc.toggleOccurrence(o)}>
                          {o.status === "DONE" ? "Reopen" : "Done"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
