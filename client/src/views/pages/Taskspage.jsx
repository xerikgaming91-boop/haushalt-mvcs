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

const weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function TasksPage() {
  const d = useDashboard();

  const from = useMemo(() => addDays(new Date(), -7), []);
  const to = useMemo(() => addDays(new Date(), 45), []);
  const tc = useTaskRangeController(d.activeHouseholdId, from, to);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueAt, setTaskDueAt] = useState(() => toDatetimeLocalValue(addDays(new Date(), 0)));
  const [assignedToId, setAssignedToId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Recurrence UI State
  const [recType, setRecType] = useState("NONE"); // NONE|DAILY|WEEKLY|MONTHLY|CUSTOM
  const [recInterval, setRecInterval] = useState(1);
  const [recUnit, setRecUnit] = useState("DAY"); // for CUSTOM
  const [recWeekdays, setRecWeekdays] = useState([]); // 0..6 (Mo..So)
  const [recMonthday, setRecMonthday] = useState(() => new Date().getDate());
  const [recEndAt, setRecEndAt] = useState("");

  const [localErr, setLocalErr] = useState("");

  const occurrences = tc.occurrences || [];

  const recurringHint = useMemo(() => {
    if (recType === "NONE") return "";
    if (recType === "DAILY") return `Alle ${recInterval} Tag(e)`;
    if (recType === "WEEKLY") return `Alle ${recInterval} Woche(n)`;
    if (recType === "MONTHLY") return `Alle ${recInterval} Monat(e)`;
    return `Custom: alle ${recInterval} ${recUnit}`;
  }, [recType, recInterval, recUnit]);

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
            <select className="col" value={recType} onChange={(e) => setRecType(e.target.value)}>
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

            <input
              className="col"
              type="datetime-local"
              value={recEndAt}
              onChange={(e) => setRecEndAt(e.target.value)}
              placeholder="Ende (optional)"
              title="Optionales Enddatum"
            />
          </div>

          {(recType === "WEEKLY" || (recType === "CUSTOM" && recUnit === "WEEK")) && (
            <div className="weekdayPicker" style={{ marginTop: 10 }}>
              <small className="muted" style={{ display: "block", marginBottom: 6 }}>
                Wochentage (optional; wenn leer → Start-Wochentag)
              </small>

              <div className="weekdayRow">
                {weekdayLabels.map((lab, idx) => {
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
                        endAt: recEndAt ? new Date(recEndAt).toISOString() : null
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
          Wiederholungen werden automatisch als einzelne Termine angezeigt. Status bei wiederkehrenden Aufgaben gilt pro Termin.
        </small>

        <hr />

        {tc.loading ? (
          <small className="muted">Lade…</small>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {occurrences.map((o) => {
              const recurring = isRecurringTask(o.baseTask);
              return (
                <div key={o.key} className={"task " + (o.status === "DONE" ? "done" : "")}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, wordBreak: "break-word" }}>
                      {o.title}
                      {recurring && <span className="badge" style={{ marginLeft: 8 }}>Serie</span>}
                    </div>
                    <small className="muted" style={{ wordBreak: "break-word" }}>
                      Fällig: {new Date(o.dueAt).toLocaleString()}
                      {" · "}
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

                    <button className="danger" onClick={() => tc.deleteTask(o.taskId)}>
                      Serie löschen
                    </button>
                  </div>
                </div>
              );
            })}

            {occurrences.length === 0 && <small className="muted">Noch keine Aufgaben in diesem Zeitraum.</small>}
          </div>
        )}
      </div>
    </div>
  );
}
