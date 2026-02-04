import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useFinancesController } from "../../controllers/useFinancesController.js";
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatEuroSigned(cents) {
  const n = (cents || 0) / 100;
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function formatEuroAbs(cents) {
  const n = Math.abs(cents || 0) / 100;
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function MoneyLineChart({ data }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const width = 900;
  const height = 220;
  const pad = 16;

  const { min, max } = useMemo(() => {
    let minV = 0;
    let maxV = 0;
    for (const p of data) {
      minV = Math.min(minV, p.availableCents);
      maxV = Math.max(maxV, p.availableCents);
    }
    if (minV === maxV) {
      minV -= 100;
      maxV += 100;
    }
    return { min: minV, max: maxV };
  }, [data]);

  const points = useMemo(() => {
    const xSpan = width - pad * 2;
    const ySpan = height - pad * 2;

    const toX = (i) => pad + (i / Math.max(1, data.length - 1)) * xSpan;
    const toY = (v) => {
      const t = (v - min) / (max - min);
      return pad + (1 - t) * ySpan;
    };

    return data.map((p, i) => ({
      ...p,
      x: toX(i),
      y: toY(p.availableCents),
    }));
  }, [data, min, max]);

  const pathD = useMemo(() => {
    if (!points.length) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  }, [points]);

  const onMove = (e) => {
    if (!svgRef.current || !points.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    let best = points[0];
    let bestDist = Math.abs(points[0].x - x);
    for (const p of points) {
      const d = Math.abs(p.x - x);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    setHover(best);
  };

  return (
    <div className="relative rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <div className="mb-3 text-sm font-semibold text-white">Verfügbar (täglich)</div>

      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="h-[220px] w-full min-w-[700px]"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <path d={pathD} fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400" />
          {hover && (
            <>
              <line
                x1={hover.x}
                x2={hover.x}
                y1={pad}
                y2={height - pad}
                stroke="rgba(148,163,184,0.4)"
                strokeWidth="1"
              />
              <circle cx={hover.x} cy={hover.y} r="4" fill="white" />
            </>
          )}
        </svg>
      </div>

      {hover && (
        <div className="pointer-events-none absolute right-4 top-4 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-slate-200 shadow">
          <div className="font-semibold text-white">{hover.label}</div>
          <div className="mt-1 text-slate-300">
            Verfügbar: <span className="font-semibold text-slate-100">{formatEuroSigned(hover.availableCents)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SlideoverShell({ title, subtitle, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-white/10 bg-slate-950 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          </div>
          <button className="rounded-lg p-2 text-slate-200 hover:bg-white/5" onClick={onClose} aria-label="Schließen">
            ✕
          </button>
        </div>

        <div className="mt-6">{children}</div>

        {footer && <div className="mt-6 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

function toEuroInputFromCents(absCents) {
  const n = (Math.abs(absCents || 0) / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n;
}

export function FinancesPage() {
  const d = useDashboard();
  const fc = useFinancesController(d.activeHouseholdId);

  const hasHousehold = Boolean(d.activeHouseholdId);

  const [startBalanceInput, setStartBalanceInput] = useState("0");

  React.useEffect(() => {
    const eur = (fc.meta.startBalanceCents || 0) / 100;
    setStartBalanceInput(
      eur.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }, [fc.meta.startBalanceCents]);

  // -------- unified slideover (Entry + optional Series) ----------
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const [editEntry, setEditEntry] = useState(null); // table row for ENTRY
  const [editSeries, setEditSeries] = useState(null); // series object

  const canToggleRecurring = !editEntry && !editSeries; // safer: no implicit conversions

  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      // common
      title: "",
      type: "EXPENSE",
      amount: "",
      note: "",
      // one-off
      date: today,
      // series
      startDate: today,
      endDate: "",
      freq: "MONTHLY",
      interval: 1,
    };
  });

  // override slideover
  const [overrideCtx, setOverrideCtx] = useState(null); // {seriesId, date, baseRow}
  const [overrideForm, setOverrideForm] = useState(() => ({
    title: "",
    type: "EXPENSE",
    amount: "",
    note: "",
  }));

  const monthRows = useMemo(() => {
    const rows = [
      {
        id: fc.carryEntry.id,
        source: "CARRY",
        date: fc.carryEntry.date,
        title: fc.carryEntry.title,
        note: fc.carryEntry.note,
        signedCents: fc.carryEntry.signedCents,
        locked: true,
      },
      ...fc.monthAll.map((e) => {
        const signed = e.type === "EXPENSE" ? -(e.amountCents || 0) : e.amountCents || 0;
        return {
          ...e,
          signedCents: signed,
          locked: false,
        };
      }),
    ];

    rows.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.source === "CARRY" && b.source !== "CARRY") return -1;
      if (a.source !== "CARRY" && b.source === "CARRY") return 1;
      return 0;
    });

    return rows;
  }, [fc.carryEntry, fc.monthAll]);

  if (!hasHousehold) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">Finanzen</h2>
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

  const openNewBooking = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditEntry(null);
    setEditSeries(null);
    setIsRecurring(false);
    setForm({
      title: "",
      type: "EXPENSE",
      amount: "",
      note: "",
      date: today,
      startDate: today,
      endDate: "",
      freq: "MONTHLY",
      interval: 1,
    });
    setBookingOpen(true);
  };

  const openEditEntry = (row) => {
    setEditSeries(null);
    setEditEntry(row);
    setIsRecurring(false);

    setForm((f) => ({
      ...f,
      title: row.title || "",
      type: row.type || "EXPENSE",
      amount: toEuroInputFromCents(Math.abs(row.signedCents)),
      note: row.note || "",
      date: row.date,
      startDate: row.date,
      endDate: "",
      freq: "MONTHLY",
      interval: 1,
    }));

    setBookingOpen(true);
  };

  const openEditSeries = (seriesObj) => {
    setEditEntry(null);
    setEditSeries(seriesObj);
    setIsRecurring(true);

    setForm((f) => ({
      ...f,
      title: seriesObj.title || "",
      type: seriesObj.type || "EXPENSE",
      amount: toEuroInputFromCents(seriesObj.amountCents || 0),
      note: seriesObj.note || "",
      startDate: seriesObj.startDate,
      endDate: seriesObj.endDate || "",
      freq: seriesObj.rule?.freq || "MONTHLY",
      interval: seriesObj.rule?.interval || 1,
      date: seriesObj.startDate,
    }));

    setBookingOpen(true);
  };

  const saveBooking = () => {
    if (!form.title.trim() || !String(form.amount).trim()) return;

    // keep dates in sync if user toggles on/off
    const startDate = form.startDate || form.date;
    const date = form.date || form.startDate;

    if (isRecurring) {
      const payload = {
        id: editSeries?.id,
        title: form.title.trim(),
        type: form.type,
        amount: form.amount,
        note: form.note,
        startDate: startDate,
        endDate: form.endDate ? form.endDate : null,
        rule: {
          freq: form.freq,
          interval: Number(form.interval || 1),
        },
      };

      if (editSeries?.id) fc.updateSeries(editSeries.id, payload);
      else fc.addSeries(payload);
    } else {
      const payload = {
        date: date,
        title: form.title.trim(),
        type: form.type,
        amount: form.amount,
        note: form.note,
      };

      if (editEntry?.id) fc.updateEntry(editEntry.id, payload);
      else fc.addEntry(payload);
    }

    setBookingOpen(false);
    setEditEntry(null);
    setEditSeries(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Finanzen</h1>
            <p className="mt-1 text-sm text-slate-400">
              Monat: <span className="font-semibold text-slate-200">{fc.monthKey}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={fc.monthKey}
              onChange={(e) => fc.setMonthKey(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
            />

            <button
              onClick={openNewBooking}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
            >
              <PlusIcon className="h-5 w-5" />
              Buchung
            </button>
          </div>
        </div>

        {/* Startsaldo + Totals */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-slate-200">Startsaldo (einmalig)</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={startBalanceInput}
                onChange={(e) => setStartBalanceInput(e.target.value)}
                onBlur={() => fc.setStartBalanceEuro(startBalanceInput)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                placeholder="0,00"
              />
              <span className="text-sm text-slate-400">EUR</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">Wird als Basis für den automatischen Übertrag verwendet.</p>
          </div>

          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs text-slate-400">Verfügbar (Start)</div>
              <div className="mt-1 text-sm font-semibold text-white">{fc.totals.startLabel}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs text-slate-400">Einnahmen</div>
              <div className="mt-1 text-sm font-semibold text-white">{fc.totals.incomeLabel}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs text-slate-400">Ausgaben</div>
              <div className="mt-1 text-sm font-semibold text-white">{fc.totals.expenseLabel}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs text-slate-400">Verfügbar (Ende)</div>
              <div className="mt-1 text-sm font-semibold text-white">{fc.totals.endLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <MoneyLineChart data={fc.dailySeries} />

      {/* List */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-base font-semibold text-white">Buchungen</h2>
        <p className="mt-1 text-sm text-slate-400">“Übertrag Vormonat” ist automatisch und wird nicht gespeichert.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="py-2 pr-3">Datum</th>
                <th className="py-2 pr-3">Titel</th>
                <th className="py-2 pr-3">Notiz</th>
                <th className="py-2 pr-3 text-right">Betrag</th>
                <th className="py-2 pr-1 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {monthRows.map((r) => {
                const isSeries = r.source === "SERIES";
                const isEntry = r.source === "ENTRY";
                const isCarry = r.source === "CARRY";
                const hasException = Boolean(r.exceptionKind);

                return (
                  <tr key={r.id} className={cn(isCarry && "opacity-80")}>
                    <td className="py-3 pr-3 whitespace-nowrap text-slate-200">{r.date}</td>

                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-100">{r.title}</div>
                        {isSeries && (
                          <span className="rounded-full border border-white/10 bg-slate-950/40 px-2 py-0.5 text-[10px] text-slate-300">
                            Serie{hasException ? ` (${r.exceptionKind})` : ""}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 pr-3 text-slate-400">{r.note}</td>

                    <td
                      className={cn(
                        "py-3 pr-3 text-right font-semibold",
                        r.signedCents < 0 ? "text-rose-300" : "text-emerald-300"
                      )}
                    >
                      {formatEuroSigned(r.signedCents)}
                    </td>

                    <td className="py-3 pr-1 text-right">
                      {/* Carry: no actions */}
                      {isCarry && <span className="text-xs text-slate-500">—</span>}

                      {/* Entry actions */}
                      {isEntry && (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditEntry(r)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/5"
                            title="Bearbeiten"
                            aria-label="Bearbeiten"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => fc.deleteEntry(r.id)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/5"
                            title="Löschen"
                            aria-label="Löschen"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}

                      {/* Series occurrence actions */}
                      {isSeries && (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setOverrideCtx({ seriesId: r.seriesId, date: r.date, base: r });
                              setOverrideForm({
                                title: r.title,
                                type: r.type,
                                amount: toEuroInputFromCents(r.amountCents || 0),
                                note: r.note || "",
                              });
                            }}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/5"
                            title="Nur dieses Datum bearbeiten (Override)"
                            aria-label="Override"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => fc.skipOccurrence(r.seriesId, r.date)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/5"
                            title="Dieses Datum überspringen"
                            aria-label="Skip"
                          >
                            <NoSymbolIcon className="h-5 w-5" />
                          </button>

                          {hasException && (
                            <button
                              onClick={() => fc.clearException(r.seriesId, r.date)}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/5"
                              title="Exception zurücksetzen"
                              aria-label="Reset"
                            >
                              <ArrowUturnLeftIcon className="h-5 w-5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const s = fc.series.find((x) => x.id === r.seriesId);
                              if (!s) return;
                              openEditSeries(s);
                            }}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/5"
                            title="Serie bearbeiten"
                            aria-label="Serie bearbeiten"
                          >
                            <ArrowPathIcon className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => fc.deleteSeries(r.seriesId)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/5"
                            title="Serie löschen"
                            aria-label="Serie löschen"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {monthRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Keine Buchungen in diesem Monat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Unified Booking Slideover --- */}
      {bookingOpen && (
        <SlideoverShell
          title={
            editSeries ? "Serie bearbeiten" : editEntry ? "Buchung bearbeiten" : "Buchung hinzufügen"
          }
          subtitle={
            editSeries
              ? "Wiederkehrende Einnahme oder Ausgabe"
              : isRecurring
              ? "Wird als Serie gespeichert"
              : "Einmalige Einnahme oder Ausgabe"
          }
          onClose={() => {
            setBookingOpen(false);
            setEditEntry(null);
            setEditSeries(null);
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setBookingOpen(false);
                  setEditEntry(null);
                  setEditSeries(null);
                }}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800/60"
              >
                Abbrechen
              </button>

              <button
                onClick={saveBooking}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
              >
                Speichern
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Toggle recurring */}
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Wiederkehrend</div>
                  <div className="text-xs text-slate-400">
                    Aktiv = als Serie speichern (monatlich/wöchentlich/jährlich).
                  </div>
                </div>

                <label className={cn("relative inline-flex items-center", !canToggleRecurring && "opacity-60")}>
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isRecurring}
                    disabled={!canToggleRecurring}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setIsRecurring(next);
                      setForm((f) => {
                        const startDate = f.startDate || f.date;
                        const date = f.date || f.startDate;
                        return {
                          ...f,
                          startDate,
                          date,
                        };
                      });
                    }}
                  />
                  <div className="h-6 w-11 rounded-full bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500/30 peer-checked:bg-sky-600" />
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
                </label>
              </div>

              {!canToggleRecurring && (
                <div className="mt-2 text-xs text-slate-400">
                  Hinweis: Beim Bearbeiten ist die Umschaltung gesperrt (keine automatische Konvertierung).
                </div>
              )}
            </div>

            {/* Date / StartDate */}
            <div>
              <label className="block text-sm font-medium text-slate-200">
                {isRecurring ? "Startdatum" : "Datum"}
              </label>
              <input
                type="date"
                value={isRecurring ? form.startDate : form.date}
                onChange={(e) =>
                  setForm((f) =>
                    isRecurring
                      ? { ...f, startDate: e.target.value, date: e.target.value }
                      : { ...f, date: e.target.value, startDate: e.target.value }
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {/* Common fields */}
            <div>
              <label className="block text-sm font-medium text-slate-200">Titel</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                placeholder="z.B. Miete, Gehalt, Einkaufen…"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-200">Typ</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="EXPENSE">Ausgabe</option>
                  <option value="INCOME">Einnahme</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Betrag</label>
                <input
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                  placeholder="z.B. 49,99"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">Notiz (optional)</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {/* Recurring fields */}
            {isRecurring && (
              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 space-y-4">
                <div className="text-sm font-semibold text-white">Serien-Einstellungen</div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-200">Wiederholung</label>
                    <select
                      value={form.freq}
                      onChange={(e) => setForm((f) => ({ ...f, freq: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value="MONTHLY">Monatlich</option>
                      <option value="WEEKLY">Wöchentlich</option>
                      <option value="YEARLY">Jährlich</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200">Intervall</label>
                    <input
                      type="number"
                      min="1"
                      value={form.interval}
                      onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200">Ende (optional)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                <p className="text-xs text-slate-400">
                  Monatlich = am Tag des Startdatums. Wöchentlich = am Wochentag des Startdatums.
                </p>
              </div>
            )}
          </div>
        </SlideoverShell>
      )}

      {/* --- Override Slideover --- */}
      {overrideCtx && (
        <SlideoverShell
          title="Override (nur dieses Datum)"
          subtitle={`Serie: ${overrideCtx.base?.title} • Datum: ${overrideCtx.date}`}
          onClose={() => setOverrideCtx(null)}
          footer={
            <>
              <button
                onClick={() => setOverrideCtx(null)}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800/60"
              >
                Abbrechen
              </button>

              <button
                onClick={() => {
                  const cents =
                    Math.abs(
                      Number(String(overrideForm.amount || "0").replace(/\./g, "").replace(",", ".")) *
                        100
                    ) || 0;

                  fc.overrideOccurrence(overrideCtx.seriesId, overrideCtx.date, {
                    title: overrideForm.title?.trim(),
                    type: overrideForm.type,
                    amountCents: cents,
                    note: overrideForm.note,
                  });
                  setOverrideCtx(null);
                }}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
              >
                Speichern
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200">Titel</label>
              <input
                value={overrideForm.title}
                onChange={(e) => setOverrideForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-200">Typ</label>
                <select
                  value={overrideForm.type}
                  onChange={(e) => setOverrideForm((f) => ({ ...f, type: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="EXPENSE">Ausgabe</option>
                  <option value="INCOME">Einnahme</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Betrag</label>
                <input
                  value={overrideForm.amount}
                  onChange={(e) => setOverrideForm((f) => ({ ...f, amount: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">Notiz</label>
              <textarea
                rows={3}
                value={overrideForm.note}
                onChange={(e) => setOverrideForm((f) => ({ ...f, note: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>
        </SlideoverShell>
      )}
    </div>
  );
}
