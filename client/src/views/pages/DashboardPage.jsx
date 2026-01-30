import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useTaskRangeController } from "../../controllers/useTaskRangeController.js";
import { isRecurringTask } from "../../lib/recurrence.js";

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

function timeLabel(dt) {
  const d = new Date(dt);
  return d.toLocaleString([], { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function Pill({ tone = "neutral", children }) {
  const cls =
    tone === "open"
      ? "border-blue-500/60 bg-blue-500/10"
      : tone === "done"
      ? "border-emerald-500/60 bg-emerald-500/10"
      : "border-slate-700 bg-slate-950/30";
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${cls}`}>{children}</span>;
}

export function DashboardPage() {
  const d = useDashboard();
  const navigate = useNavigate();

  const rangeFrom = useMemo(() => startOfDay(new Date()), []);
  const rangeTo = useMemo(() => endOfDay(addDays(rangeFrom, 30)), [rangeFrom]);

  const tc = useTaskRangeController(d.activeHouseholdId, rangeFrom, rangeTo);

  const globalStats = useMemo(() => {
    const occ = tc.occurrences || [];
    const open = occ.filter((o) => o.status !== "DONE").length;
    const done = occ.filter((o) => o.status === "DONE").length;
    return { open, done, total: occ.length };
  }, [tc.occurrences]);

  // ✅ Gruppierte Übersicht: pro Task/Serie nur nächste Occurrence anzeigen
  const groupedUpcoming = useMemo(() => {
    const now = Date.now();
    const groups = tc.seriesGroups || [];

    const out = [];

    for (const g of groups) {
      const task = g.task;
      const occ = (g.occurrences || []).slice().sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

      const next = occ.find((o) => new Date(o.dueAt).getTime() >= now) || occ[0] || null;
      if (!next) continue;

      out.push({
        task,
        nextOccurrence: next,
        open: g.open ?? occ.filter((o) => o.status !== "DONE").length,
        done: g.done ?? occ.filter((o) => o.status === "DONE").length,
        total: g.total ?? occ.length
      });
    }

    out.sort((a, b) => new Date(a.nextOccurrence.dueAt) - new Date(b.nextOccurrence.dueAt));
    return out.slice(0, 5);
  }, [tc.seriesGroups]);

  if (!d.activeHousehold) {
    return (
      <div className="ui-card">
        <h2 className="text-lg font-semibold">Übersicht</h2>
        <p className="mt-1 text-sm text-slate-400">
          Du hast noch keinen Haushalt ausgewählt/angelegt. Bitte gehe zu <Link to="/household">Haushalt</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(d.error || tc.error) && (
        <div className="rounded-2xl border border-red-500/60 bg-red-500/10 p-4 text-sm">
          {tc.error || d.error}
        </div>
      )}

      <div className="ui-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Übersicht</h2>
            <div className="mt-1 text-sm text-slate-400">
              Aktiver Haushalt: <Pill>{d.activeHousehold.name}</Pill>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Zeitraum: {rangeFrom.toLocaleDateString()} – {rangeTo.toLocaleDateString()}
            </div>
          </div>

          <button type="button" className="ui-btn-primary" onClick={() => navigate("/tasks")}>
            Aufgaben öffnen
          </button>
        </div>

        <hr className="my-4 border-slate-800" />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="ui-card-subtle">
            <div className="text-sm font-semibold text-slate-200">Offen</div>
            <div className="mt-2 text-3xl font-semibold">{globalStats.open}</div>
            <div className="mt-2 text-sm text-slate-400">
              <Link to="/tasks">Zu den Aufgaben</Link>
            </div>
          </div>

          <div className="ui-card-subtle">
            <div className="text-sm font-semibold text-slate-200">Erledigt</div>
            <div className="mt-2 text-3xl font-semibold">{globalStats.done}</div>
            <div className="mt-2 text-sm text-slate-400">
              <Link to="/tasks">Aufgaben ansehen</Link>
            </div>
          </div>

          <div className="ui-card-subtle">
            <div className="text-sm font-semibold text-slate-200">Kalender</div>
            <div className="mt-2 text-3xl font-semibold">↗</div>
            <div className="mt-2 text-sm text-slate-400">
              <Link to="/calendar">Zum Kalender</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Gruppierte "Nächste Aufgaben" */}
      <div className="ui-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Nächste Aufgaben</h2>
            <div className="mt-1 text-sm text-slate-400">
              Gruppiert nach Aufgabe/Serie: pro Eintrag nur der nächste Termin.
            </div>
          </div>

          <button type="button" className="ui-btn" onClick={() => navigate("/tasks")}>
            Aufgaben verwalten
          </button>
        </div>

        <hr className="my-4 border-slate-800" />

        {tc.loading ? (
          <div className="text-sm text-slate-400">Lade…</div>
        ) : groupedUpcoming.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-4 text-sm text-slate-400">
            Keine anstehenden Aufgaben im Zeitraum.
          </div>
        ) : (
          <div className="space-y-2">
            {groupedUpcoming.map((g) => {
              const recurring = isRecurringTask(g.task);
              const o = g.nextOccurrence;

              return (
                <div
                  key={g.task.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold break-words">{g.task.title}</div>
                      <Pill>{recurring ? "Serie" : "Einzeln"}</Pill>
                      <Pill tone="open">Offen: {g.open}</Pill>
                      <Pill tone="done">Done: {g.done}</Pill>
                    </div>

                    <div className="mt-1 text-sm text-slate-400 break-words">
                      Nächster Termin: {timeLabel(o.dueAt)}
                      {" · "}
                      {o.assignedTo ? `Zuweisung: ${o.assignedTo.name}` : "Unzugewiesen"}
                      {o.category?.name ? ` · ${o.category.name}` : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Pill tone={o.status === "DONE" ? "done" : "open"}>
                      {o.status === "DONE" ? "Erledigt" : "Offen"}
                    </Pill>

                    <button type="button" className="ui-btn" onClick={() => tc.toggleOccurrence(o)}>
                      {o.status === "DONE" ? "Reopen" : "Done"}
                    </button>

                    <button type="button" className="ui-btn" onClick={() => navigate("/tasks")}>
                      Öffnen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
