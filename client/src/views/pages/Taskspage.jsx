import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";

import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useTaskRangeController } from "../../controllers/useTaskRangeController.js";
import { isRecurringTask } from "../../lib/recurrence.js";

import { SlideOver } from "../../components/SlideOver.jsx";
import { ConfirmDialog } from "../../components/ConfirmDialog.jsx";

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

  const occurrences = tc.occurrences || [];

  // UI State
  const [createOpen, setCreateOpen] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { taskId, title, recurring }

  const [localErr, setLocalErr] = useState("");

  // Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueAt, setTaskDueAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [assignedToId, setAssignedToId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Recurrence
  const [recType, setRecType] = useState("NONE"); // NONE|DAILY|WEEKLY|MONTHLY|CUSTOM
  const [recInterval, setRecInterval] = useState(1);
  const [recUnit, setRecUnit] = useState("DAY"); // for CUSTOM
  const [recWeekdays, setRecWeekdays] = useState([]); // 0..6 (Mo..So)
  const [recMonthday, setRecMonthday] = useState(() => new Date().getDate());
  const [recEndAt, setRecEndAt] = useState("");

  const recurringHint = useMemo(() => {
    if (recType === "NONE") return "";
    if (recType === "DAILY") return `Alle ${recInterval} Tag(e)`;
    if (recType === "WEEKLY") return `Alle ${recInterval} Woche(n)`;
    if (recType === "MONTHLY") return `Alle ${recInterval} Monat(e)`;
    return `Custom: alle ${recInterval} ${recUnit}`;
  }, [recType, recInterval, recUnit]);

  const resetForm = () => {
    setTaskTitle("");
    setTaskDueAt(toDatetimeLocalValue(new Date()));
    setAssignedToId("");
    setCategoryId("");

    setRecType("NONE");
    setRecInterval(1);
    setRecUnit("DAY");
    setRecWeekdays([]);
    setRecMonthday(new Date().getDate());
    setRecEndAt("");
  };

  const openDeleteConfirm = (taskId, title, recurring) => {
    setDeleteTarget({ taskId, title, recurring });
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget?.taskId) return;
    setLocalErr("");

    try {
      await tc.deleteTask(deleteTarget.taskId);
    } catch (e) {
      setLocalErr(e?.message || "Löschen fehlgeschlagen.");
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const createTask = async () => {
    setLocalErr("");

    try {
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
              endAt: recEndAt ? new Date(recEndAt).toISOString() : null,
            };

      await tc.createTask({
        householdId: d.activeHouseholdId,
        title: taskTitle.trim(),
        dueAt: dueAtIso,
        assignedToId: assignedToId || null,
        categoryId: categoryId || null,
        recurrence,
      });

      setCreateOpen(false);
      resetForm();
    } catch (e) {
      setLocalErr(e?.message || "Speichern fehlgeschlagen.");
    }
  };

  if (!d.activeHousehold) {
    return (
      <div className="tw-card">
        <h2 className="text-lg font-semibold text-white">Aufgaben</h2>
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
    <div className="space-y-6">
      {(d.error || tc.error || localErr) && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {localErr || tc.error || d.error}
        </div>
      )}

      {/* Header */}
      <div className="tw-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Aufgaben</h2>
            <p className="mt-1 text-sm text-slate-400">
              Aktiver Haushalt:{" "}
              <span className="tw-pill tw-pill-muted">{d.activeHousehold.name}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Vorschau: letzte 7 Tage + nächste 45 Tage. Wiederholungen werden als einzelne Termine angezeigt.
            </p>
          </div>

          <button type="button" className="tw-btn tw-btn-primary" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-5 w-5" />
            Neue Aufgabe
          </button>
        </div>
      </div>

      {/* List */}
      <div className="tw-card">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Termine</h3>
            <p className="mt-1 text-xs text-slate-400">Status gilt pro Termin (Occurrence).</p>
          </div>

          <Link className="text-sm font-semibold text-sky-300 hover:text-sky-200" to="/calendar">
            Zum Kalender →
          </Link>
        </div>

        <hr className="tw-divider" />

        {tc.loading ? (
          <p className="text-sm text-slate-400">Lade…</p>
        ) : occurrences.length === 0 ? (
          <p className="text-sm text-slate-400">Noch keine Aufgaben im Zeitraum.</p>
        ) : (
          <ul role="list" className="divide-y divide-white/10">
            {occurrences.map((o) => {
              const recurring = isRecurringTask(o.baseTask);
              const statusIsDone = o.status === "DONE";

              return (
                <li key={o.key} className="flex flex-wrap items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{o.title}</p>
                      {recurring ? <span className="tw-pill tw-pill-muted">Serie</span> : null}
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Fällig: {new Date(o.dueAt).toLocaleString("de-DE")}
                      {" · "}
                      Zuweisung: {o.assignedTo ? o.assignedTo.name : "—"}
                      {" · "}
                      Kategorie: {o.category ? o.category.name : "—"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className={["tw-pill", statusIsDone ? "tw-pill-done" : "tw-pill-open"].join(" ")}>
                      {statusIsDone ? "Erledigt" : "Offen"}
                    </span>

                    <button type="button" className="tw-btn" onClick={() => tc.toggleOccurrence(o)}>
                      {statusIsDone ? "Reopen" : "Done"}
                    </button>

                    <button
                      type="button"
                      className="tw-btn tw-btn-danger"
                      onClick={() => openDeleteConfirm(o.taskId, o.title, recurring)}
                      title={recurring ? "Löscht die komplette Serie" : "Löscht die Aufgabe"}
                    >
                      {recurring ? "Serie löschen" : "Löschen"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Create SlideOver */}
      <SlideOver
        open={createOpen}
        title="Neue Aufgabe"
        subtitle="Erstelle eine Aufgabe – optional mit Wiederholung."
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="tw-btn tw-btn-ghost"
              onClick={() => {
                resetForm();
                setCreateOpen(false);
              }}
            >
              Abbrechen
            </button>

            <div className="flex items-center gap-2">
              <button type="button" className="tw-btn" onClick={resetForm}>
                Reset
              </button>

              <button
                type="button"
                className="tw-btn tw-btn-primary"
                disabled={!taskTitle.trim() || tc.loading}
                onClick={createTask}
              >
                Speichern
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Details */}
          <div className="tw-card-soft">
            <h4 className="text-sm font-semibold text-white">Details</h4>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="tw-label">Titel</label>
                <input
                  className="tw-input mt-2"
                  placeholder="z. B. Müll rausbringen"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="tw-label">Fällig am</label>
                  <input
                    className="tw-input mt-2"
                    type="datetime-local"
                    value={taskDueAt}
                    onChange={(e) => {
                      setTaskDueAt(e.target.value);
                      const dt = new Date(e.target.value);
                      if (!Number.isNaN(dt.getTime())) setRecMonthday(dt.getDate());
                    }}
                  />
                </div>

                <div>
                  <label className="tw-label">Ende der Wiederholung (optional)</label>
                  <input
                    className="tw-input mt-2"
                    type="datetime-local"
                    value={recEndAt}
                    onChange={(e) => setRecEndAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="tw-label">Zuweisung</label>
                  <select className="tw-select mt-2" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
                    <option value="">— Keine —</option>
                    {(d.members || []).map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="tw-label">Kategorie</label>
                  <select className="tw-select mt-2" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">— Keine —</option>
                    {(d.categories || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div className="tw-card-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-white">Wiederholung</h4>
                <p className="mt-1 text-xs text-slate-400">Optional. “Keine” erstellt nur einen Termin.</p>
              </div>
              {recType !== "NONE" ? <span className="tw-pill tw-pill-muted">{recurringHint}</span> : null}
            </div>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="tw-label">Typ</label>
                  <select className="tw-select mt-2" value={recType} onChange={(e) => setRecType(e.target.value)}>
                    <option value="NONE">Keine</option>
                    <option value="DAILY">Täglich</option>
                    <option value="WEEKLY">Wöchentlich</option>
                    <option value="MONTHLY">Monatlich</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="tw-label">Intervall</label>
                    <input
                      className="tw-input mt-2"
                      type="number"
                      min={1}
                      max={365}
                      value={recInterval}
                      onChange={(e) => setRecInterval(Math.max(1, Number(e.target.value || 1)))}
                    />
                  </div>

                  <div>
                    <label className="tw-label">Einheit</label>
                    <select
                      className="tw-select mt-2"
                      value={recUnit}
                      onChange={(e) => setRecUnit(e.target.value)}
                      disabled={recType !== "CUSTOM"}
                      title={recType === "CUSTOM" ? "" : "Nur bei Custom aktiv"}
                    >
                      <option value="DAY">Tag(e)</option>
                      <option value="WEEK">Woche(n)</option>
                      <option value="MONTH">Monat(e)</option>
                    </select>
                  </div>
                </div>
              </div>

              {(recType === "WEEKLY" || (recType === "CUSTOM" && recUnit === "WEEK")) && (
                <div>
                  <label className="tw-label">Wochentage (optional)</label>
                  <p className="tw-help mt-1">Wenn leer → Start-Wochentag wird verwendet.</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {weekdayLabels.map((lab, idx) => {
                      const checked = recWeekdays.includes(idx);
                      return (
                        <button
                          key={lab}
                          type="button"
                          onClick={() => {
                            setRecWeekdays((prev) => {
                              const s = new Set(prev);
                              if (s.has(idx)) s.delete(idx);
                              else s.add(idx);
                              return Array.from(s).sort((a, b) => a - b);
                            });
                          }}
                          className={[
                            "tw-btn px-3 py-2 text-xs",
                            checked ? "border-sky-500/40 bg-sky-500/10 text-sky-100" : "text-slate-200",
                          ].join(" ")}
                        >
                          {lab}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(recType === "MONTHLY" || (recType === "CUSTOM" && recUnit === "MONTH")) && (
                <div className="grid gap-2">
                  <label className="tw-label">Tag im Monat (optional)</label>
                  <p className="tw-help">Standard = Datum der ersten Aufgabe.</p>
                  <input
                    className="tw-input"
                    type="number"
                    min={1}
                    max={31}
                    value={recMonthday}
                    onChange={(e) => setRecMonthday(Math.min(31, Math.max(1, Number(e.target.value || 1))))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </SlideOver>

      {/* Confirm Delete Modal */}
      <ConfirmDialog
        open={confirmOpen}
        title={deleteTarget?.recurring ? "Serie löschen?" : "Aufgabe löschen?"}
        message={
          deleteTarget?.recurring
            ? `“${deleteTarget?.title || ""}” löschen? Das entfernt die komplette Serie (alle Wiederholungen).`
            : `“${deleteTarget?.title || ""}” löschen? Das kann nicht rückgängig gemacht werden.`
        }
        confirmText="Löschen"
        cancelText="Abbrechen"
        variant="danger"
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={doDelete}
      />
    </div>
  );
}
