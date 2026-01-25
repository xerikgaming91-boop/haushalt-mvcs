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

function endOfDayIso(dateValue) {
  // dateValue: YYYY-MM-DD, interpreted as local date.
  const dt = new Date(`${dateValue}T23:59:59`);
  return dt.toISOString();
}

function describeRecurrence(task) {
  const type = task.recurrenceType || "NONE";
  if (type === "NONE") return "Einmalig";

  const interval = Math.max(1, Number(task.recurrenceInterval || 1));
  const unit = task.recurrenceUnit || "DAY";
  const effectiveType = type === "CUSTOM" ? unit : type;

  if (effectiveType === "DAILY" || effectiveType === "DAY") {
    return interval === 1 ? "Täglich" : `Alle ${interval} Tage`;
  }
  if (effectiveType === "WEEKLY" || effectiveType === "WEEK") {
    return interval === 1 ? "Wöchentlich" : `Alle ${interval} Wochen`;
  }
  if (effectiveType === "MONTHLY" || effectiveType === "MONTH") {
    return interval === 1 ? "Monatlich" : `Alle ${interval} Monate`;
  }

  return "Wiederholung";
}

// bewusst umbenannt, damit es garantiert keine Kollision mehr gibt
const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function TasksPage() {
  const d = useDashboard();

  const from = useMemo(() => addDays(new Date(), -7), []);
  const to = useMemo(() => addDays(new Date(), 45), []);
  const tc = useTaskRangeController(d.activeHouseholdId, from, to);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueAt, setTaskDueAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [assignedToId, setAssignedToId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Recurrence UI State
  const [recType, setRecType] = useState("NONE"); // NONE|DAILY|WEEKLY|MONTHLY|CUSTOM
  const [recInterval, setRecInterval] = useState(1);
  const [recUnit, setRecUnit] = useState("DAY"); // for CUSTOM
  const [recWeekdays, setRecWeekdays] = useState([]); // 0..6 (Mo..So)
  const [recMonthday, setRecMonthday] = useState(() => new Date().getDate());

  // Optional end
  const [recEndEnabled, setRecEndEnabled] = useState(false);
  const [recEndDate, setRecEndDate] = useState(""); // YYYY-MM-DD

  const [localErr, setLocalErr] = useState("");

  const seriesGroups = tc.seriesGroups || [];

  const recurringHint = useMemo(() => {
    if (recType === "NONE") return "";
    if (recType === "DAILY") return recInterval === 1 ? "Täglich" : `Alle ${recInterval} Tag(e)`;
    if (recType === "WEEKLY") return recInterval === 1 ? "Wöchentlich" : `Alle ${recInterval} Woche(n)`;
    if (recType === "MONTHLY") return recInterval === 1 ? "Monatlich" : `Alle ${recInterval} Monat(e)`;
    return `Custom: alle ${recInterval} ${recUnit}`;
  }, [recType, recInterval, recUnit]);

  const startInPast = useMemo(() => {
    const dt = new Date(taskDueAt);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() < Date.now();
  }, [taskDueAt]);

  if (!d.activeHousehold) {
    return (
      <div className="card">
        <h2>Aufgaben</h2>
        <small className="muted">
          Bitte zuerst einen Haushalt auswählen/erstellen unter <Link to="/household">Haushalt</Link>.
        </small>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {(d.error || tc.error || localErr) && (
        <div className="card" style={{ borderColor: "#ef4444" }}>
          {localErr || tc.error || d.error}
        </div>
      )}

      <div className="card">
        <h2>Aufgaben</h2>
        <small className="muted">
          Aktiver Haushalt: <span className="badge">{d.activeHousehold.name}</span>
        </small>

        <hr />

        <h3>Neue Aufgabe</h3>

        <div className="row">
          <input
            className="col"
            placeholder="Titel"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />

          <input
            className="col"
            type="datetime-local"
            value={taskDueAt}
            onChange={(e) => {
              setTaskDueAt(e.target.value);
              const dt = new Date(e.target.value);
              if (!Number.isNaN(dt.getTime())) setRecMonthday(dt.getDate());
            }}
          />
        </div>

        {recType !== "NONE" && startInPast && (
          <div
            className="card"
            style={{
              marginTop: 10,
              borderColor: "#f59e0b",
              background: "#0b1220"
            }}
          >
            <small className="muted">
              Hinweis: Der Start der Serie liegt in der Vergangenheit. Das ist erlaubt, kann aber verwirrend sein, wenn du
              eigentlich „ab jetzt“ starten wolltest.
            </small>
          </div>
        )}

        <div className="row" style={{ marginTop: 10 }}>
          <select className="col" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
            <option value="">— Zuweisung —</option>
            {(d.members || []).map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name}
              </option>
            ))}
          </select>

          <select className="col" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">— Kategorie —</option>
            {(d.categories || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginBottom: 8 }}>Wiederholung</h3>

          <div className="row">
            <select
              className="col"
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
              style={{ width: 140 }}
              type="number"
              min={1}
              max={365}
              value={recInterval}
              onChange={(e) => setRecInterval(Math.max(1, Number(e.target.value || 1)))}
            />

            {recType === "CUSTOM" && (
              <select style={{ width: 170 }} value={recUnit} onChange={(e) => setRecUnit(e.target.value)}>
                <option value="DAY">Tag(e)</option>
                <option value="WEEK">Woche(n)</option>
                <option value="MONTH">Monat(e)</option>
              </select>
            )}

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                border: "1px solid #243047",
                borderRadius: 10,
                background: "#0b1220"
              }}
            >
              <input
                type="checkbox"
                checked={recEndEnabled}
                disabled={recType === "NONE"}
                onChange={(e) => {
                  const on = e.target.checked;
                  setRecEndEnabled(on);
                  if (!on) setRecEndDate("");
                }}
              />
              <span>Ende setzen</span>
            </label>

            {recEndEnabled && recType !== "NONE" && (
              <input
                style={{ width: 170 }}
                type="date"
                value={recEndDate}
                onChange={(e) => setRecEndDate(e.target.value)}
                title="Optionales Enddatum (inklusive)"
              />
            )}
          </div>

          {(recType === "WEEKLY" || (recType === "CUSTOM" && recUnit === "WEEK")) && (
            <div className="weekdayPicker" style={{ marginTop: 10 }}>
              <small className="muted" style={{ display: "block", marginBottom: 6 }}>
                Wochentage (optional; wenn leer → Start-Wochentag)
              </small>

              <div className="weekdayRow">
                {WEEKDAY_LABELS.map((lab, idx) => {
                  const checked = recWeekdays.includes(idx);
                  return (
                    <label key={lab} className={"weekdayChip " + (checked ? "on" : "")}>
                      <input
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
            <div style={{ marginTop: 10 }}>
              <small className="muted" style={{ display: "block", marginBottom: 6 }}>
                Tag im Monat (optional; Standard = Datum der ersten Aufgabe)
              </small>
              <input
                style={{ width: 160 }}
                type="number"
                min={1}
                max={31}
                value={recMonthday}
                onChange={(e) => setRecMonthday(Math.min(31, Math.max(1, Number(e.target.value || 1))))}
              />
            </div>
          )}

          {recType !== "NONE" && (
            <small className="muted" style={{ display: "block", marginTop: 10 }}>
              Vorschau: {recurringHint}
              {recEndEnabled && recEndDate ? ` · Ende: ${new Date(recEndDate).toLocaleDateString()}` : " · Ohne Ende"}
            </small>
          )}
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <button
            className="primary"
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

      <div className="card">
        <h3>Vorschau (nächste 45 Tage)</h3>
        <small className="muted">
          Wiederholungen werden als Serie gruppiert angezeigt. Status bei wiederkehrenden Aufgaben gilt pro Termin.
        </small>

        <hr />

        {tc.loading ? (
          <small className="muted">Lade…</small>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {seriesGroups.map((g) => {
              const recurring = isRecurringTask(g.task);
              const label = describeRecurrence(g.task);
              const endAt = g.task.recurrenceEndAt ? new Date(g.task.recurrenceEndAt) : null;
              const startAt = g.task.dueAt ? new Date(g.task.dueAt) : null;

              return (
                <details key={g.task.id} className="task" style={{ padding: 0, overflow: "hidden" }}>
                  <summary
                    style={{
                      listStyle: "none",
                      cursor: "pointer",
                      padding: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start"
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, wordBreak: "break-word" }}>
                        {g.task.title}
                        <span className="badge" style={{ marginLeft: 8 }}>
                          {recurring ? "Serie" : "Einzeln"}
                        </span>
                      </div>
                      <small className="muted" style={{ wordBreak: "break-word" }}>
                        {label}
                        {startAt ? ` · Start: ${startAt.toLocaleString()}` : ""}
                        {endAt ? ` · Ende: ${endAt.toLocaleString()}` : recurring ? " · Ohne Ende" : ""}
                        {" · "}
                        {g.task.assignedTo ? "Zuweisung: " + g.task.assignedTo.name : "Keine Zuweisung"}
                        {" · "}
                        {g.task.category ? "Kategorie: " + g.task.category.name : "Keine Kategorie"}
                      </small>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <span className="statusPill open" title="Offene Termine in diesem Zeitraum">
                        Offen: {g.open}
                      </span>
                      <span className="statusPill done" title="Erledigte Termine in diesem Zeitraum">
                        Done: {g.done}
                      </span>

                      <button
                        className="danger"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          tc.deleteTask(g.task.id);
                        }}
                      >
                        {recurring ? "Serie löschen" : "Aufgabe löschen"}
                      </button>
                    </div>
                  </summary>

                  <div style={{ display: "grid", gap: 10, padding: 10, borderTop: "1px solid #1f2937" }}>
                    {(g.occurrences || []).map((o) => (
                      <div key={o.key} className={"task " + (o.status === "DONE" ? "done" : "")}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, wordBreak: "break-word" }}>
                            {new Date(o.dueAt).toLocaleString()}
                          </div>
                          <small className="muted" style={{ wordBreak: "break-word" }}>
                            {o.assignedTo ? "Zuweisung: " + o.assignedTo.name : "Keine Zuweisung"}
                            {" · "}
                            {o.category ? "Kategorie: " + o.category.name : "Keine Kategorie"}
                          </small>
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span className={"statusPill " + (o.status === "DONE" ? "done" : "open")}>
                            {o.status === "DONE" ? "Erledigt" : "Offen"}
                          </span>

                          <button onClick={() => tc.toggleOccurrence(o)}>
                            {o.status === "DONE" ? "Reopen" : "Done"}
                          </button>
                        </div>
                      </div>
                    ))}

                    {(g.occurrences || []).length === 0 && <small className="muted">Keine Termine im Zeitraum.</small>}
                  </div>
                </details>
              );
            })}

            {seriesGroups.length === 0 && <small className="muted">Noch keine Aufgaben in diesem Zeitraum.</small>}
          </div>
        )}
      </div>
    </div>
  );
}
