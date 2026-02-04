// client/src/views/pages/FinancesPage.jsx
import React, { useMemo, useRef, useState } from "react";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useFinancesController } from "../../controllers/useFinancesController.js";
import { SlideOver } from "../../components/SlideOver.jsx";
import { ConfirmDialog } from "../../components/ConfirmDialog.jsx";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function eur(cents) {
  const v = (Number(cents || 0) / 100) || 0;
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v);
}

function isoToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseAmountToCents(str) {
  const s = (str || "").toString().trim().replace(",", ".");
  const v = Number(s);
  if (!Number.isFinite(v)) return NaN;
  return Math.round(v * 100);
}

function monthLabelNice(yyyymm) {
  const [y, m] = (yyyymm || "").split("-");
  const mm = Number(m);
  const names = [
    "Januar","Februar","März","April","Mai","Juni",
    "Juli","August","September","Oktober","November","Dezember",
  ];
  return names[mm - 1] ? `${names[mm - 1]} ${y}` : yyyymm;
}

const weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function buildCumulative(items, from, to) {
  const start = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");

  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${day}`);
  }

  const byDay = new Map();
  for (const it of items || []) {
    const day = it.date;
    if (!day) continue;
    const signed = it.type === "EXPENSE" ? -(it.amountCents || 0) : (it.amountCents || 0);
    byDay.set(day, (byDay.get(day) || 0) + signed);
  }

  let cum = 0;
  const cumArr = days.map((day) => {
    cum += byDay.get(day) || 0;
    return { day, cum };
  });

  const min = Math.min(...cumArr.map((x) => x.cum), 0);
  const max = Math.max(...cumArr.map((x) => x.cum), 0);

  return { cumArr, min, max };
}

function NetChart({ items, from, to }) {
  const wrapRef = useRef(null);
  const { cumArr, min, max } = useMemo(() => buildCumulative(items, from, to), [items, from, to]);
  const [hover, setHover] = useState(null);

  const W = 720;
  const H = 180;
  const PAD = 18;

  const scaleX = (i) => {
    const span = (cumArr.length - 1) || 1;
    return PAD + (i / span) * (W - PAD * 2);
  };

  const scaleY = (val) => {
    const span = (max - min) || 1;
    const t = (val - min) / span;
    return PAD + (1 - t) * (H - PAD * 2);
  };

  const poly = cumArr.map((p, i) => `${scaleX(i).toFixed(2)},${scaleY(p.cum).toFixed(2)}`).join(" ");
  const last = cumArr.length ? cumArr[cumArr.length - 1].cum : 0;

  const onMove = (e) => {
    if (!wrapRef.current || !cumArr.length) return;

    const rect = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.round(t * (cumArr.length - 1));
    setHover({ idx, x });
  };

  const onLeave = () => setHover(null);
  const hoverPoint = hover ? cumArr[hover.idx] : null;

  return (
    <div className="tw-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Verlauf (Monat)</div>
          <div className="text-xs text-slate-400">Kumuliert: Einnahmen − Ausgaben (inkl. Übertrag)</div>
        </div>
        <div className={cn("text-sm font-semibold", last >= 0 ? "text-emerald-300" : "text-rose-300")}>
          {eur(last)}
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950/40"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-[180px] w-full">
          <line x1={0} y1={scaleY(0)} x2={W} y2={scaleY(0)} stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
          <polyline
            fill="none"
            stroke="rgba(56,189,248,0.9)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={poly}
          />
          {hoverPoint ? (
            <circle cx={scaleX(hover.idx)} cy={scaleY(hoverPoint.cum)} r="5" fill="rgba(56,189,248,0.95)" />
          ) : null}
        </svg>

        {hoverPoint && hover ? (
          <div
            className="pointer-events-none absolute top-3 left-3 w-[220px] rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow-lg"
            style={{
              transform: `translate(${Math.min(
                Math.max(hover.x - 30, 0),
                (wrapRef.current?.clientWidth || 0) - 220
              )}px, 0px)`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{hoverPoint.day}</div>
              <div className={cn("font-semibold", hoverPoint.cum >= 0 ? "text-emerald-300" : "text-rose-300")}>
                {eur(hoverPoint.cum)}
              </div>
            </div>
            <div className="mt-1 text-slate-400">Verfügbar bis einschließlich {hoverPoint.day}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FinancesPage() {
  const d = useDashboard();
  const f = useFinancesController(d.activeHouseholdId);

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [type, setType] = useState("EXPENSE");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(isoToday());
  const [note, setNote] = useState("");

  const [recType, setRecType] = useState("NONE");
  const [recInterval, setRecInterval] = useState(1);
  const [recWeekdays, setRecWeekdays] = useState([]);
  const [recMonthday, setRecMonthday] = useState(() => new Date().getDate());
  const [recEndDate, setRecEndDate] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const resetForm = () => {
    setType("EXPENSE");
    setTitle("");
    setAmount("");
    setDate(isoToday());
    setNote("");

    setRecType("NONE");
    setRecInterval(1);
    setRecWeekdays([]);
    setRecMonthday(new Date().getDate());
    setRecEndDate("");

    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setPanelOpen(true);
  };

  const openEdit = (item) => {
    if (item?.isAuto) return; // ✅ Auto-Übertrag nicht editierbar
    setEditing(item);

    setType(item.type || "EXPENSE");
    setTitle(item.title || "");
    setAmount(((item.amountCents || 0) / 100).toFixed(2).replace(".", ","));
    setNote(item.note || "");

    const baseStart = item?.seriesStartDate || item?.date || isoToday();
    setDate(baseStart);

    const rec = item?.recurrence || { type: "NONE" };
    setRecType(rec?.type || "NONE");
    setRecInterval(Math.max(1, Number(rec?.interval || 1)));
    setRecWeekdays(Array.isArray(rec?.byWeekday) ? rec.byWeekday : []);
    setRecMonthday(rec?.byMonthday ? Number(rec.byMonthday) : new Date(baseStart + "T00:00:00").getDate());
    setRecEndDate(rec?.endDate || "");

    setPanelOpen(true);
  };

  const submit = async () => {
    const amountCents = parseAmountToCents(amount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) throw new Error("Bitte Betrag eingeben.");
    if (!d.activeHouseholdId) throw new Error("Bitte zuerst einen Haushalt auswählen.");

    const recurrence =
      recType === "NONE"
        ? { type: "NONE" }
        : {
            type: recType,
            interval: recInterval,
            byWeekday: recType === "WEEKLY" ? recWeekdays : undefined,
            byMonthday: recType === "MONTHLY" ? recMonthday : undefined,
            endDate: recEndDate || null,
          };

    if (editing) {
      await f.updateEntry(editing.baseId || editing.id, { type, title, amountCents, date, note, recurrence });
    } else {
      await f.createEntry({ type, title, amountCents, date, note, recurrence });
    }

    setPanelOpen(false);
    resetForm();
  };

  const askDelete = (item) => {
    if (item?.isAuto) return; // ✅ Auto-Übertrag nicht löschbar
    setDeleteTarget(item);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    await f.removeEntry(deleteTarget.baseId || deleteTarget.id);
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  if (!d.activeHousehold) {
    return (
      <div className="tw-card">
        <h2 className="text-lg font-semibold text-white">Finanzen</h2>
        <p className="mt-2 text-sm text-slate-400">Bitte zuerst einen Haushalt auswählen/erstellen.</p>
      </div>
    );
  }

  const monthTitle = monthLabelNice(f.monthLabel);

  return (
    <div className="space-y-6">
      {(d.error || f.error) ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {d.error || f.error}
        </div>
      ) : null}

      <div className="tw-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">Finanzen</div>
            <div className="mt-1 text-sm text-slate-300">
              Aktiver Haushalt: <span className="tw-pill tw-pill-muted">{d.activeHousehold.name}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="tw-icon-btn" onClick={f.prevMonth} title="Vorheriger Monat">
              <ArrowLeftIcon className="h-5 w-5" />
            </button>

            <div className="min-w-[220px] text-center">
              <div className="text-sm font-semibold text-white">{monthTitle}</div>
              <div className="text-xs text-slate-400">{f.from} bis {f.to}</div>
            </div>

            <button className="tw-icon-btn" onClick={f.nextMonth} title="Nächster Monat">
              <ArrowRightIcon className="h-5 w-5" />
            </button>

            <button className="tw-btn tw-btn-primary" onClick={openCreate}>
              <PlusIcon className="h-5 w-5" />
              Neue Buchung
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="tw-card">
          <div className="text-xs text-slate-400">Einnahmen</div>
          <div className="mt-1 text-xl font-semibold text-emerald-300">{eur(f.incomeCents)}</div>
        </div>

        <div className="tw-card">
          <div className="text-xs text-slate-400">Ausgaben</div>
          <div className="mt-1 text-xl font-semibold text-rose-300">{eur(f.expenseCents)}</div>
        </div>

        <div className="tw-card">
          <div className="text-xs text-slate-400">Verfügbar (Netto)</div>
          <div className={cn("mt-1 text-xl font-semibold", f.netCents >= 0 ? "text-sky-300" : "text-rose-300")}>
            {eur(f.netCents)}
          </div>
        </div>
      </div>

      <NetChart items={f.items} from={f.from} to={f.to} />

      <div className="tw-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">Buchungen</div>
            <div className="text-xs text-slate-400">{f.items.length} Einträge (inkl. Serien + Übertrag)</div>
          </div>
          <button className="tw-btn" onClick={f.reload}>Aktualisieren</button>
        </div>

        <hr className="tw-divider" />

        {f.loading ? (
          <div className="py-6 text-sm text-slate-300">Lädt…</div>
        ) : f.items.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">Noch keine Einträge im Monat.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {f.items.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "tw-pill",
                        e.type === "INCOME"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-100"
                      )}
                    >
                      {e.type === "INCOME" ? "Einnahme" : "Ausgabe"}
                    </span>

                    {e.isAuto ? <span className="tw-pill tw-pill-muted">Übertrag</span> : null}
                    {e.isRecurring ? <span className="tw-pill tw-pill-muted">Serie</span> : null}

                    <div className="truncate text-sm font-semibold text-white">{e.title}</div>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{e.date}</span>
                    {e.note ? <span className="truncate max-w-[560px]">• {e.note}</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "min-w-[140px] text-right text-sm font-semibold",
                      e.type === "INCOME" ? "text-emerald-300" : "text-rose-300"
                    )}
                  >
                    {e.type === "INCOME" ? "+" : "-"}
                    {eur(e.amountCents)}
                  </div>

                  {!e.isAuto ? (
                    <>
                      <button className="tw-icon-btn" onClick={() => openEdit(e)} title="Bearbeiten">
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button className="tw-icon-btn" onClick={() => askDelete(e)} title="Löschen">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SlideOver (unverändert) */}
      <SlideOver
        open={panelOpen}
        title={editing ? (editing?.isRecurring ? "Serie bearbeiten" : "Buchung bearbeiten") : "Neue Buchung"}
        subtitle="Einnahmen/Ausgaben eintragen. Optional als Serie (wiederkehrend)."
        onClose={() => {
          setPanelOpen(false);
          resetForm();
        }}
        footer={
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="tw-btn tw-btn-ghost"
              onClick={() => {
                setPanelOpen(false);
                resetForm();
              }}
            >
              Abbrechen
            </button>

            <button
              type="button"
              className="tw-btn tw-btn-primary"
              disabled={!amount || !date}
              onClick={async () => {
                try {
                  await submit();
                } catch (e) {
                  alert(e?.message || "Speichern fehlgeschlagen.");
                }
              }}
            >
              Speichern
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="tw-card-soft">
            <label className="tw-label">Typ</label>
            <select className="tw-select mt-2" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="EXPENSE">Ausgabe</option>
              <option value="INCOME">Einnahme</option>
            </select>
          </div>

          <div className="tw-card-soft">
            <label className="tw-label">Titel</label>
            <input
              className="tw-input mt-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Miete, Gehalt, Lebensmittel…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tw-card-soft">
              <label className="tw-label">Betrag (€)</label>
              <input
                className="tw-input mt-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="z. B. 49,99"
                inputMode="decimal"
              />
            </div>

            <div className="tw-card-soft">
              <label className="tw-label">{recType === "NONE" ? "Datum" : "Start-Datum"}</label>
              <input className="tw-input mt-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="tw-card-soft">
            <label className="tw-label">Notiz</label>
            <textarea className="tw-textarea mt-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional…" />
          </div>

          {/* Recurrence (unverändert) */}
          <div className="tw-card-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Wiederkehrend</div>
                <div className="mt-1 text-xs text-slate-400">Für Miete, Gehalt, Abos etc. (als Serie).</div>
              </div>
              {recType !== "NONE" ? <span className="tw-pill tw-pill-muted">Serie aktiv</span> : null}
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
                  </select>
                </div>

                <div>
                  <label className="tw-label">Intervall</label>
                  <input
                    className="tw-input mt-2"
                    type="number"
                    min={1}
                    max={365}
                    value={recInterval}
                    onChange={(e) => setRecInterval(Math.max(1, Number(e.target.value || 1)))}
                    disabled={recType === "NONE"}
                  />
                </div>
              </div>

              {recType === "WEEKLY" ? (
                <div>
                  <label className="tw-label">Wochentage</label>
                  <div className="mt-2 flex flex-wrap gap-2">
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
                          className={cn(
                            "tw-btn px-3 py-2 text-xs",
                            checked ? "border-sky-500/40 bg-sky-500/10 text-sky-100" : "text-slate-200"
                          )}
                          disabled={recType === "NONE"}
                          title="Wenn nichts gewählt ist, wird der Start-Wochentag genutzt."
                        >
                          {lab}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Wenn du nichts auswählst, nimmt er automatisch den Start-Wochentag.
                  </div>
                </div>
              ) : null}

              {recType === "MONTHLY" ? (
                <div className="grid gap-2">
                  <label className="tw-label">Tag im Monat</label>
                  <input
                    className="tw-input"
                    type="number"
                    min={1}
                    max={31}
                    value={recMonthday}
                    onChange={(e) => setRecMonthday(Math.min(31, Math.max(1, Number(e.target.value || 1))))}
                    disabled={recType === "NONE"}
                  />
                </div>
              ) : null}

              {recType !== "NONE" ? (
                <div>
                  <label className="tw-label">Ende (optional)</label>
                  <input className="tw-input mt-2" type="date" value={recEndDate} onChange={(e) => setRecEndDate(e.target.value)} />
                  <div className="mt-2 text-xs text-slate-500">Leer lassen = unendlich.</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog
        open={confirmOpen}
        title={deleteTarget?.isRecurring ? "Serie löschen?" : "Eintrag löschen?"}
        message={
          deleteTarget?.isRecurring
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
