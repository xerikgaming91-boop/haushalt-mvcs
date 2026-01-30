import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useTaskRangeController } from "../../controllers/useTaskRangeController.js";
import { isRecurringTask } from "../../lib/recurrence.js";

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

function toDateValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function parseDateStart(dateValue) {
  return new Date(`${dateValue}T00:00:00`);
}

function parseDateEnd(dateValue) {
  return new Date(`${dateValue}T23:59:59`);
}

function endOfDayIso(dateValue) {
  const dt = new Date(`${dateValue}T23:59:59`);
  return dt.toISOString();
}

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function SegBtn({ active, children, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={active ? "ui-chip-on" : "ui-chip-off"}
    >
      {children}
    </button>
  );
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

function describeRecurrence(task) {
  const type = task.recurrenceType || "NONE";
  if (type === "NONE") return "Einmalig";

  const interval = Math.max(1, Number(task.recurrenceInterval || 1));
  const unit = task.recurrenceUnit || "DAY";
  const effectiveType = type === "CUSTOM" ? unit : type;

  if (effectiveType === "DAILY" || effectiveType === "DAY") return interval === 1 ? "Täglich" : `Alle ${interval} Tage`;
  if (effectiveType === "WEEKLY" || effectiveType === "WEEK") return interval === 1 ? "Wöchentlich" : `Alle ${interval} Wochen`;
  if (effectiveType === "MONTHLY" || effectiveType === "MONTH") return interval === 1 ? "Monatlich" : `Alle ${interval} Monate`;
  return "Wiederholung";
}

export function TasksPage() {
  const d = useDashboard();

  // ---------- Filter ----------
  const [preset, setPreset] = useState("STANDARD"); // STANDARD | NEXT7 | NEXT30 | NEXT90 | CUSTOM
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [rangeFrom, setRangeFrom] = useState(() => toDateValue(addDays(new Date(), -7)));
  const [rangeTo, setRangeTo] = useState(() => toDateValue(addDays(new Date(), 30)));

  const [grouped, setGrouped] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | OPEN | DONE

  const applyPreset = (next) => {
    const now = new Date();
    if (next === "STANDARD") {
      setRangeFrom(toDateValue(addDays(now, -7)));
      setRangeTo(toDateValue(addDays(now, 30)));
      setShowAdvanced(false);
    } else if (next === "NEXT7") {
      setRangeFrom(toDateValue(addDays(now, 0)));
      setRangeTo(toDateValue(addDays(now, 7)));
      setShowAdvanced(false);
    } else if (next === "NEXT30") {
      setRangeFrom(toDateValue(addDays(now, 0)));
      setRangeTo(toDateValue(addDays(now, 30)));
      setShowAdvanced(false);
    } else if (next === "NEXT90") {
      setRangeFrom(toDateValue(addDays(now, 0)));
      setRangeTo(toDateValue(addDays(now, 90)));
      setShowAdvanced(false);
    } else {
      setShowAdvanced(true);
    }
    setPreset(next);
  };

  const { fromDate, toDate, rangeWarning } = useMemo(() => {
    let from = parseDateStart(rangeFrom);
    let to = parseDateEnd(rangeTo);

    let warning = "";
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      warning = "Ungültiger Datumsbereich.";
      from = parseDateStart(toDateValue(new Date()));
      to = parseDateEnd(toDateValue(addDays(new Date(), 30)));
    } else if (from.getTime() > to.getTime()) {
      warning = "Startdatum liegt nach Enddatum. Bereich wurde getauscht.";
      const tmpFrom = rangeTo;
      const tmpTo = rangeFrom;
      from = parseDateStart(tmpFrom);
      to = parseDateEnd(tmpTo);
    }

    return { fromDate: from, toDate: to, rangeWarning: warning };
  }, [rangeFrom, rangeTo]);

  const tc = useTaskRangeController(d.activeHouseholdId, fromDate, toDate);

  const rangeLabel = useMemo(() => `${fromDate.toLocaleDateString()} – ${toDate.toLocaleDateString()}`, [fromDate, toDate]);

  const seriesGroups = useMemo(() => {
    const groups = tc.seriesGroups || [];
    if (statusFilter === "ALL") return groups;

    const wantDone = statusFilter === "DONE";
    return groups
      .map((g) => {
        const occ = (g.occurrences || []).filter((o) => (wantDone ? o.status === "DONE" : o.status !== "DONE"));
        if (occ.length === 0) return null;

        const done = occ.filter((o) => o.status === "DONE").length;
        const open = occ.length - done;

        return { ...g, occurrences: occ, total: occ.length, done, open };
      })
      .filter(Boolean);
  }, [tc.seriesGroups, statusFilter]);

  const flatOccurrences = useMemo(() => {
    const occ = tc.occurrences || [];
    if (statusFilter === "ALL") return occ;
    if (statusFilter === "DONE") return occ.filter((o) => o.status === "DONE");
    return occ.filter((o) => o.status !== "DONE");
  }, [tc.occurrences, statusFilter]);

  // ---------- Create Task ----------
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueAt, setTaskDueAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [assignedToId, setAssignedToId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [recType, setRecType] = useState("NONE"); // NONE|DAILY|WEEKLY|MONTHLY|CUSTOM
  const [recInterval, setRecInterval] = useState(1);
  const [recUnit, setRecUnit] = useState("DAY"); // for CUSTOM
  const [recWeekdays, setRecWeekdays] = useState([]); // 0..6 (Mo..So)
  const [recMonthday, setRecMonthday] = useState(() => new Date().getDate());
  const [recEndEnabled, setRecEndEnabled] = useState(false);
  const [recEndDate, setRecEndDate] = useState(""); // YYYY-MM-DD

  const [localErr, setLocalErr] = useState("");

  const startInPast = useMemo(() => {
    if (recType === "NONE") return false;
    const dt = new Date(taskDueAt);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() < Date.now();
  }, [taskDueAt, recType]);

  if (!d.activeHousehold) {
    return (
      <div className="ui-card">
        <h2 className="text-lg font-semibold">Aufgaben</h2>
        <p className="mt-1 text-sm text-slate-400">
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
      {(d.error || tc.error || localErr) && (
        <div className="rounded-2xl border border-red-500/60 bg-red-500/10 p-4 text-sm">
          {localErr || tc.error || d.error}
        </div>
      )}

      {/* Create */}
      <div className="ui-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Aufgaben</h2>
            <div className="mt-1 text-sm text-slate-400">
              Aktiver Haushalt: <Pill>{d.activeHousehold.name}</Pill>
            </div>
          </div>
        </div>

        <hr className="my-4 border-slate-800" />

        <h3 className="ui-section-title">Neue Aufgabe</h3>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="ui-input" placeholder="Titel" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
          <input
            className="ui-input"
            type="datetime-local"
            value={taskDueAt}
            onChange={(e) => {
              setTaskDueAt(e.target.value);
              const dt = new Date(e.target.value);
              if (!Number.isNaN(dt.getTime())) setRecMonthday(dt.getDate());
            }}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <select className="ui-select" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
            <option value="">— Zuweisung —</option>
            {(d.members || []).map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name}
              </option>
            ))}
          </select>

          <select className="ui-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">— Kategorie —</option>
            {(d.categories || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Recurrence */}
        <div className="mt-4 ui-card-subtle">
          <div className="flex items-center justify-between gap-2">
            <h3 className="ui-section-title">Wiederholung</h3>
            {recType !== "NONE" && <Pill>{startInPast ? "Start in Vergangenheit" : "Serie aktiv"}</Pill>}
          </div>

          {startInPast && (
            <div className="mt-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-slate-200">
              Hinweis: Der Start der Serie liegt in der Vergangenheit. Das ist erlaubt, kann aber verwirrend sein, wenn du
              eigentlich „ab jetzt“ starten wolltest.
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-4">
            <select
              className="ui-select"
              value={recType}
              onChange={(e) => {
                const next = e.target.value;
                setRecType(next);
                if (next === "NONE") {
                  setRecEndEnabled(false);
                  setRecEndDate("");
                }
              }}
            >
              <option value="NONE">Keine</option>
              <option value="DAILY">Täglich</option>
              <option value="WEEKLY">Wöchentlich</option>
              <option value="MONTHLY">Monatlich</option>
              <option value="CUSTOM">Custom</option>
            </select>

            <input
              className="ui-input"
              type="number"
              min={1}
              max={365}
              value={recInterval}
              onChange={(e) => setRecInterval(Math.max(1, Number(e.target.value || 1)))}
              placeholder="Intervall"
              title="Intervall"
            />

            {recType === "CUSTOM" ? (
              <select className="ui-select" value={recUnit} onChange={(e) => setRecUnit(e.target.value)}>
                <option value="DAY">Tag(e)</option>
                <option value="WEEK">Woche(n)</option>
                <option value="MONTH">Monat(e)</option>
              </select>
            ) : (
              <div className="hidden lg:block" />
            )}

            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 px-3 py-2">
              <span className="text-sm text-slate-200">Ende setzen</span>
              <input
                className="ui-checkbox"
                type="checkbox"
                checked={recEndEnabled}
                disabled={recType === "NONE"}
                onChange={(e) => {
                  const on = e.target.checked;
                  setRecEndEnabled(on);
                  if (!on) setRecEndDate("");
                }}
              />
            </label>
          </div>

          {recEndEnabled && recType !== "NONE" && (
            <div className="mt-3">
              <input className="ui-input max-w-xs" type="date" value={recEndDate} onChange={(e) => setRecEndDate(e.target.value)} />
            </div>
          )}

          {(recType === "WEEKLY" || (recType === "CUSTOM" && recUnit === "WEEK")) && (
            <div className="mt-4">
              <div className="ui-muted">Wochentage (optional; wenn leer → Start-Wochentag)</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((lab, idx) => {
                  const checked = recWeekdays.includes(idx);
                  return (
                    <label
                      key={lab}
                      className={checked ? "ui-chip-on cursor-pointer select-none flex items-center gap-2" : "ui-chip-off cursor-pointer select-none flex items-center gap-2"}
                    >
                      <input
                        className="ui-checkbox"
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setRecWeekdays((prev) => {
                            const s = new Set(prev);
                            if (on) s.add(idx);
                            else s.delete(idx);
                            return Array.from(s).sort((a, b) => a - b);
                          });
                        }}
                      />
                      <span>{lab}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {(recType === "MONTHLY" || (recType === "CUSTOM" && recUnit === "MONTH")) && (
            <div className="mt-4">
              <div className="ui-muted">Tag im Monat (optional; Standard = Datum der ersten Aufgabe)</div>
              <input
                className="ui-input mt-2 max-w-xs"
                type="number"
                min={1}
                max={31}
                value={recMonthday}
                onChange={(e) => setRecMonthday(Math.min(31, Math.max(1, Number(e.target.value || 1))))}
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <button
            className="ui-btn-primary"
            type="button"
            disabled={!taskTitle.trim() || tc.loading}
            onClick={async () => {
              try {
                setLocalErr("");

                const dueAtIso = new Date(taskDueAt).toISOString();

                const recurrence =
                  recType === "NONE"
                    ? { type: "NONE" }
                    : {
                        type: recType,
                        interval: recInterval,
                        unit: recType === "CUSTOM" ? recUnit : undefined,
                        byWeekday:
                          recType === "WEEKLY" || (recType === "CUSTOM" && recUnit === "WEEK")
                            ? recWeekdays.length
                              ? recWeekdays
                              : undefined
                            : undefined,
                        byMonthday:
                          recType === "MONTHLY" || (recType === "CUSTOM" && recUnit === "MONTH")
                            ? recMonthday
                            : undefined,
                        endAt: recEndEnabled && recEndDate ? endOfDayIso(recEndDate) : null
                      };

                await tc.createTask({
                  householdId: d.activeHouseholdId,
                  title: taskTitle,
                  dueAt: dueAtIso,
                  assignedToId: assignedToId || null,
                  categoryId: categoryId || null,
                  recurrence
                });

                setTaskTitle("");
              } catch (e) {
                setLocalErr(e.message);
              }
            }}
          >
            Speichern
          </button>
        </div>
      </div>

      {/* List + Filter */}
      <div className="ui-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="ui-section-title">Aufgaben</h3>
            <div className="ui-muted">Zeitraum: {rangeLabel}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SegBtn active={preset === "STANDARD"} onClick={() => applyPreset("STANDARD")} title="Letzte 7 bis nächste 30">
              Standard
            </SegBtn>
            <SegBtn active={preset === "NEXT7"} onClick={() => applyPreset("NEXT7")}>7</SegBtn>
            <SegBtn active={preset === "NEXT30"} onClick={() => applyPreset("NEXT30")}>30</SegBtn>
            <SegBtn active={preset === "NEXT90"} onClick={() => applyPreset("NEXT90")}>90</SegBtn>
            <SegBtn active={preset === "CUSTOM"} onClick={() => applyPreset("CUSTOM")}>Custom</SegBtn>

            <span className="mx-1 hidden sm:inline-block h-6 w-px bg-slate-800" />

            <SegBtn active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>Alle</SegBtn>
            <SegBtn active={statusFilter === "OPEN"} onClick={() => setStatusFilter("OPEN")}>Offen</SegBtn>
            <SegBtn active={statusFilter === "DONE"} onClick={() => setStatusFilter("DONE")}>Erledigt</SegBtn>

            <span className="mx-1 hidden sm:inline-block h-6 w-px bg-slate-800" />

            <SegBtn active={grouped} onClick={() => setGrouped((p) => !p)} title="Serien gruppieren">
              {grouped ? "Gruppiert" : "Ungruppiert"}
            </SegBtn>
            <SegBtn active={showAdvanced} onClick={() => setShowAdvanced((p) => !p)}>
              {showAdvanced ? "Weniger" : "Erweitert"}
            </SegBtn>
          </div>
        </div>

        {(showAdvanced || preset === "CUSTOM") && (
          <>
            <hr className="my-4 border-slate-800" />

            {rangeWarning && (
              <div className="mb-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
                {rangeWarning}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="ui-muted">Von</div>
                <input
                  className="ui-input mt-1"
                  type="date"
                  value={rangeFrom}
                  onChange={(e) => {
                    setPreset("CUSTOM");
                    setRangeFrom(e.target.value);
                  }}
                />
              </div>

              <div>
                <div className="ui-muted">Bis</div>
                <input
                  className="ui-input mt-1"
                  type="date"
                  value={rangeTo}
                  onChange={(e) => {
                    setPreset("CUSTOM");
                    setRangeTo(e.target.value);
                  }}
                />
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <button
                  type="button"
                  className="ui-btn"
                  onClick={() => {
                    setPreset("CUSTOM");
                    setRangeFrom(toDateValue(addDays(new Date(), 0)));
                    setRangeTo(toDateValue(addDays(new Date(), 7)));
                  }}
                >
                  Ab heute +7
                </button>
                <button
                  type="button"
                  className="ui-btn"
                  onClick={() => {
                    setPreset("CUSTOM");
                    setRangeFrom(toDateValue(addDays(new Date(), 0)));
                    setRangeTo(toDateValue(addDays(new Date(), 30)));
                  }}
                >
                  Ab heute +30
                </button>
                <button
                  type="button"
                  className="ui-btn"
                  onClick={() => {
                    setPreset("CUSTOM");
                    setRangeFrom(toDateValue(addDays(new Date(), -30)));
                    setRangeTo(toDateValue(addDays(new Date(), 0)));
                  }}
                >
                  Letzte 30
                </button>
              </div>
            </div>
          </>
        )}

        <hr className="my-4 border-slate-800" />

        {tc.loading ? (
          <div className="ui-muted">Lade…</div>
        ) : grouped ? (
          <div className="space-y-3">
            {seriesGroups.map((g) => {
              const recurring = isRecurringTask(g.task);
              const label = describeRecurrence(g.task);
              const endAt = g.task.recurrenceEndAt ? new Date(g.task.recurrenceEndAt) : null;
              const startAt = g.task.dueAt ? new Date(g.task.dueAt) : null;

              return (
                <details key={g.task.id} className="rounded-2xl border border-slate-800 bg-slate-950/30">
                  <summary className="cursor-pointer list-none px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold break-words">{g.task.title}</div>
                          <Pill>{recurring ? "Serie" : "Einzeln"}</Pill>
                        </div>

                        <div className="mt-1 text-sm text-slate-400 break-words">
                          {label}
                          {startAt ? ` · Start: ${startAt.toLocaleString()}` : ""}
                          {recurring ? (endAt ? ` · Ende: ${endAt.toLocaleString()}` : " · Ohne Ende") : ""}
                          {" · "}
                          {g.task.assignedTo ? `Zuweisung: ${g.task.assignedTo.name}` : "Keine Zuweisung"}
                          {" · "}
                          {g.task.category ? `Kategorie: ${g.task.category.name}` : "Keine Kategorie"}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone="open">Offen: {g.open}</Pill>
                        <Pill tone="done">Done: {g.done}</Pill>

                        {/* Tailwind delete */}
                        <button
                          type="button"
                          className="ui-btn-danger"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            tc.deleteTask(g.task.id);
                          }}
                        >
                          {recurring ? "Serie löschen" : "Aufgabe löschen"}
                        </button>
                      </div>
                    </div>
                  </summary>

                  <div className="border-t border-slate-800 px-4 py-3 space-y-2">
                    {(g.occurrences || []).map((o) => (
                      <div
                        key={o.key}
                        className={[
                          "flex flex-wrap items-start justify-between gap-3 rounded-2xl border px-3 py-3",
                          o.status === "DONE" ? "border-slate-800 bg-slate-950/20 opacity-70" : "border-slate-800 bg-slate-950/30"
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <div className="font-medium break-words">{new Date(o.dueAt).toLocaleString()}</div>
                          <div className="mt-1 text-sm text-slate-400 break-words">
                            {o.assignedTo ? `Zuweisung: ${o.assignedTo.name}` : "Keine Zuweisung"}
                            {" · "}
                            {o.category ? `Kategorie: ${o.category.name}` : "Keine Kategorie"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Pill tone={o.status === "DONE" ? "done" : "open"}>
                            {o.status === "DONE" ? "Erledigt" : "Offen"}
                          </Pill>
                          <button type="button" className="ui-btn" onClick={() => tc.toggleOccurrence(o)}>
                            {o.status === "DONE" ? "Reopen" : "Done"}
                          </button>
                        </div>
                      </div>
                    ))}

                    {(g.occurrences || []).length === 0 && (
                      <div className="ui-muted">Keine Termine im Zeitraum (oder durch Filter ausgeblendet).</div>
                    )}
                  </div>
                </details>
              );
            })}

            {seriesGroups.length === 0 && <div className="ui-muted">Keine Aufgaben im gewählten Zeitraum.</div>}
          </div>
        ) : (
          <div className="space-y-2">
            {flatOccurrences.map((o) => {
              const recurring = isRecurringTask(o.baseTask);
              return (
                <div
                  key={o.key}
                  className={[
                    "flex flex-wrap items-start justify-between gap-3 rounded-2xl border px-4 py-3",
                    o.status === "DONE" ? "border-slate-800 bg-slate-950/20 opacity-70" : "border-slate-800 bg-slate-950/30"
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold break-words">{o.title}</div>
                      {recurring && <Pill>Serie</Pill>}
                    </div>
                    <div className="mt-1 text-sm text-slate-400 break-words">
                      Fällig: {new Date(o.dueAt).toLocaleString()}
                      {" · "}
                      {o.assignedTo ? `Zuweisung: ${o.assignedTo.name}` : "Keine Zuweisung"}
                      {" · "}
                      {o.category ? `Kategorie: ${o.category.name}` : "Keine Kategorie"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Pill tone={o.status === "DONE" ? "done" : "open"}>{o.status === "DONE" ? "Erledigt" : "Offen"}</Pill>
                    <button type="button" className="ui-btn" onClick={() => tc.toggleOccurrence(o)}>
                      {o.status === "DONE" ? "Reopen" : "Done"}
                    </button>
                    {/* Tailwind delete (auch in ungrouped sichtbar) */}
                    <button type="button" className="ui-btn-danger" onClick={() => tc.deleteTask(o.taskId)}>
                      {recurring ? "Serie löschen" : "Aufgabe löschen"}
                    </button>
                  </div>
                </div>
              );
            })}

            {flatOccurrences.length === 0 && <div className="ui-muted">Keine Aufgaben im gewählten Zeitraum.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
