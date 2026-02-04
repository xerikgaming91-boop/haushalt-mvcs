// client/src/services/finances.service.js
// LocalStorage Storage (pro Haushalt) inkl. wiederkehrender Buchungen (Serie)
// + Exceptions: "nur dieses Vorkommen" (OVERRIDE / SKIP / CLEAR)
//
// WICHTIG: Keine JSX hier.

const LS_PREFIX = "hh_finances_";

function keyFor(householdId) {
  if (!householdId) throw new Error("householdId fehlt");
  return `${LS_PREFIX}${householdId}`;
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function loadAll(householdId) {
  const raw = localStorage.getItem(keyFor(householdId));
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr : [];
}

function saveAll(householdId, entries) {
  localStorage.setItem(keyFor(householdId), JSON.stringify(entries));
}

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODate(d) {
  // YYYY-MM-DD
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = pad2(dt.getMonth() + 1);
  const day = pad2(dt.getDate());
  return `${y}-${m}-${day}`;
}

function clampString(s, max = 200) {
  const x = (s ?? "").toString().trim();
  return x.length > max ? x.slice(0, max) : x;
}

function ymdInRange(ymd, from, to) {
  // Lexicographic works for YYYY-MM-DD
  if (from && ymd < from) return false;
  if (to && ymd > to) return false;
  return true;
}

function weekdayMon0(date) {
  // JS: Sun=0..Sat=6 => Mon=0..Sun=6
  return (date.getDay() + 6) % 7;
}

function addDaysDate(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function addMonthsDate(d, n) {
  const x = new Date(d);
  const day = x.getDate();
  x.setMonth(x.getMonth() + n);

  // clamp if month shorter
  if (x.getDate() !== day) {
    x.setDate(0);
  }
  return x;
}

function normalizeRecurrence(rec) {
  if (!rec || typeof rec !== "object") return { type: "NONE" };

  const type = rec.type || "NONE";
  const interval = Math.max(1, Number(rec.interval || 1));

  const endDate = rec.endDate ? toISODate(rec.endDate) : null;

  // byWeekday Mon=0..Sun=6
  const byWeekday = Array.isArray(rec.byWeekday)
    ? Array.from(new Set(rec.byWeekday.map((x) => Number(x)).filter((x) => x >= 0 && x <= 6))).sort((a, b) => a - b)
    : [];

  const byMonthday = rec.byMonthday ? Math.min(31, Math.max(1, Number(rec.byMonthday))) : null;

  if (type === "DAILY" || type === "WEEKLY" || type === "MONTHLY") {
    return { type, interval, endDate, byWeekday, byMonthday };
  }

  return { type: "NONE" };
}

// --- Exceptions (nur dieses Vorkommen) --------------------------------------
// Stored on template entry:
// exceptions: {
//   "2026-02-14": { action: "SKIP" }
//   "2026-02-20": { action: "OVERRIDE", patch: { amountCents, title, note, type } }
// }

function normalizeExceptionAction(action) {
  const a = (action || "").toString().toUpperCase();
  if (a === "SKIP" || a === "OVERRIDE" || a === "CLEAR") return a;
  return null;
}

function sanitizeExceptionPatch(patch) {
  const out = {};

  if (patch?.type) {
    out.type = patch.type === "EXPENSE" ? "EXPENSE" : "INCOME";
  }

  if (patch?.title !== undefined) {
    out.title = clampString(patch.title, 80);
  }

  if (patch?.note !== undefined) {
    out.note = clampString(patch.note, 500);
  }

  if (patch?.amountCents !== undefined) {
    const v = Number(patch.amountCents);
    if (!Number.isFinite(v) || v <= 0) {
      throw new Error("Exception-Betrag muss > 0 sein.");
    }
    out.amountCents = Math.round(v);
  }

  return out;
}

function applyOccurrenceException(occ, template, ymd) {
  const exMap = template?.exceptions && typeof template.exceptions === "object" ? template.exceptions : null;
  const ex = exMap ? exMap[ymd] : null;

  if (!ex || typeof ex !== "object") return occ;

  const action = normalizeExceptionAction(ex.action);
  if (action === "SKIP") return null;

  if (action === "OVERRIDE") {
    const patch = ex.patch && typeof ex.patch === "object" ? ex.patch : {};
    const next = { ...occ };

    if (patch.type) next.type = patch.type === "EXPENSE" ? "EXPENSE" : "INCOME";
    if (patch.title !== undefined) next.title = clampString(patch.title, 80) || next.title;
    if (patch.note !== undefined) next.note = clampString(patch.note, 500);
    if (patch.amountCents !== undefined) {
      const v = Number(patch.amountCents);
      if (Number.isFinite(v) && v > 0) next.amountCents = Math.round(v);
    }

    next.isException = true;
    next.exceptionAction = "OVERRIDE";
    next.exceptionDate = ymd;
    return next;
  }

  return occ;
}

function expandRecurring(template, from, to) {
  // Returns occurrence items within [from..to] inclusive.
  const rec = normalizeRecurrence(template.recurrence);
  if (rec.type === "NONE") return [];

  const startYMD = template.date; // series start date
  const endYMD = rec.endDate && rec.endDate < to ? rec.endDate : to;

  if (!startYMD) return [];

  const startDate = new Date(startYMD + "T00:00:00");
  const fromDate = new Date((from || startYMD) + "T00:00:00");
  const toDate = new Date(endYMD + "T00:00:00");

  const out = [];

  const pushOcc = (occDate) => {
    const ymd = toISODate(occDate);
    if (!ymdInRange(ymd, from, endYMD)) return;
    if (ymd < startYMD) return;

    const baseOcc = {
      id: `${template.id}|${ymd}`,
      baseId: template.id,
      isRecurring: true,
      seriesStartDate: startYMD,
      date: ymd, // occurrence date
      type: template.type,
      title: template.title,
      note: template.note,
      amountCents: template.amountCents,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      recurrence: rec,
      isException: false,
      exceptionAction: null,
      exceptionDate: null,
    };

    const finalOcc = applyOccurrenceException(baseOcc, template, ymd);
    if (finalOcc) out.push(finalOcc);
  };

  if (rec.type === "DAILY") {
    let d = new Date(startDate);

    if (from && from > startYMD) {
      const diffDays = Math.floor((fromDate - startDate) / (24 * 3600 * 1000));
      const steps = Math.floor(diffDays / rec.interval);
      d = addDaysDate(startDate, steps * rec.interval);

      while (toISODate(d) < from) d = addDaysDate(d, rec.interval);
    }

    while (d <= toDate) {
      pushOcc(d);
      d = addDaysDate(d, rec.interval);
    }

    return out;
  }

  if (rec.type === "WEEKLY") {
    const wds = rec.byWeekday && rec.byWeekday.length ? rec.byWeekday : [weekdayMon0(startDate)];

    const startWeek = new Date(startDate);
    startWeek.setDate(startWeek.getDate() - weekdayMon0(startWeek)); // back to Monday

    let week = new Date(startWeek);

    if (from && from > toISODate(startDate)) {
      const fromWeek = new Date(fromDate);
      fromWeek.setDate(fromWeek.getDate() - weekdayMon0(fromWeek));
      const diffWeeks = Math.floor((fromWeek - startWeek) / (7 * 24 * 3600 * 1000));
      const steps = Math.floor(diffWeeks / rec.interval);
      week = addDaysDate(startWeek, steps * rec.interval * 7);
      while (week < fromWeek) week = addDaysDate(week, rec.interval * 7);
    }

    while (week <= toDate) {
      for (const wd of wds) {
        const occ = addDaysDate(week, wd);
        if (occ < startDate) continue;
        if (occ > toDate) continue;
        pushOcc(occ);
      }
      week = addDaysDate(week, rec.interval * 7);
    }

    out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return out;
  }

  if (rec.type === "MONTHLY") {
    const day = rec.byMonthday || new Date(startYMD + "T00:00:00").getDate();

    let d = new Date(startDate);
    d.setDate(1);
    d.setDate(Math.min(day, 31));
    if (d.getMonth() !== new Date(startDate).getMonth()) {
      d.setDate(0);
    }

    if (d < startDate) {
      d = addMonthsDate(d, rec.interval);
      d.setDate(1);
      d.setDate(Math.min(day, 31));
      if (d.getDate() !== Math.min(day, 31)) d.setDate(0);
    }

    if (from && from > startYMD) {
      while (toISODate(d) < from) {
        d = addMonthsDate(d, rec.interval);
        const m = d.getMonth();
        d.setDate(1);
        d.setDate(Math.min(day, 31));
        if (d.getMonth() !== m) d.setDate(0);
      }
    }

    while (d <= toDate) {
      pushOcc(d);
      d = addMonthsDate(d, rec.interval);
      const m = d.getMonth();
      d.setDate(1);
      d.setDate(Math.min(day, 31));
      if (d.getMonth() !== m) d.setDate(0);
    }

    return out;
  }

  return [];
}

export const financesService = {
  /**
   * List entries in date-range (inclusive).
   * from/to are YYYY-MM-DD.
   *
   * IMPORTANT:
   * - one-time entries: included as-is
   * - recurring templates: expanded into occurrences within range
   * - exceptions on template are applied to occurrences
   */
  async list({ householdId, from, to }) {
    const all = loadAll(householdId);

    const items = [];
    for (const e of all) {
      const rec = normalizeRecurrence(e.recurrence);

      if (rec.type === "NONE") {
        if (e?.date && ymdInRange(e.date, from, to)) {
          items.push({
            ...e,
            baseId: e.id,
            isRecurring: false,
            seriesStartDate: null,
            recurrence: rec,
            isException: false,
            exceptionAction: null,
            exceptionDate: null,
          });
        }
      } else {
        items.push(...expandRecurring(e, from, to));
      }
    }

    items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return { items };
  },

  /**
   * Create entry or recurring template
   */
  async create(dto) {
    const householdId = dto?.householdId;
    const type = dto?.type === "EXPENSE" ? "EXPENSE" : "INCOME";

    const title = clampString(dto?.title, 80) || (type === "INCOME" ? "Einnahme" : "Ausgabe");
    const note = clampString(dto?.note, 500);

    const amountCents = Number(dto?.amountCents);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new Error("Betrag muss > 0 sein.");
    }

    const isoDate = dto?.date ? toISODate(dto.date) : toISODate(new Date());
    const recurrence = normalizeRecurrence(dto?.recurrence);

    const entry = {
      id: uid(),
      householdId,
      type,
      title,
      note,
      amountCents: Math.round(amountCents),
      date: isoDate, // start date / one-time date
      recurrence, // always normalized
      exceptions: {}, // <-- neu: exceptions map (nur relevant für Serie)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const all = loadAll(householdId);
    all.push(entry);
    saveAll(householdId, all);

    return { item: entry };
  },

  /**
   * Update entry/template by base id
   *
   * Supports:
   * - normal fields: type/title/note/date/amountCents/recurrence
   * - setException: { date, action: "SKIP"|"OVERRIDE"|"CLEAR", patch? }
   */
  async update(householdId, id, patch) {
    const all = loadAll(householdId);
    const idx = all.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Eintrag nicht gefunden.");

    const curr = all[idx];
    const next = { ...curr };

    if (patch?.type) next.type = patch.type === "EXPENSE" ? "EXPENSE" : "INCOME";
    if (patch?.title !== undefined) next.title = clampString(patch.title, 80) || next.title;
    if (patch?.note !== undefined) next.note = clampString(patch.note, 500);
    if (patch?.date) next.date = toISODate(patch.date);

    if (patch?.amountCents !== undefined) {
      const v = Number(patch.amountCents);
      if (!Number.isFinite(v) || v <= 0) throw new Error("Betrag muss > 0 sein.");
      next.amountCents = Math.round(v);
    }

    if (patch?.recurrence !== undefined) {
      next.recurrence = normalizeRecurrence(patch.recurrence);
    }

    // Exceptions
    if (patch?.setException && typeof patch.setException === "object") {
      const action = normalizeExceptionAction(patch.setException.action);
      if (!action) throw new Error("Ungültige Exception-Action.");

      const ymd = patch.setException.date ? toISODate(patch.setException.date) : null;
      if (!ymd) throw new Error("Exception-Date fehlt.");

      const rec = normalizeRecurrence(next.recurrence);
      if (rec.type === "NONE") {
        throw new Error("Exceptions sind nur bei Serien möglich.");
      }

      const exMap = next.exceptions && typeof next.exceptions === "object" ? { ...next.exceptions } : {};

      if (action === "CLEAR") {
        delete exMap[ymd];
      } else if (action === "SKIP") {
        exMap[ymd] = { action: "SKIP" };
      } else if (action === "OVERRIDE") {
        const sanitized = sanitizeExceptionPatch(patch.setException.patch || {});
        exMap[ymd] = { action: "OVERRIDE", patch: sanitized };
      }

      next.exceptions = exMap;
    }

    next.updatedAt = new Date().toISOString();
    all[idx] = next;
    saveAll(householdId, all);

    return { item: next };
  },

  async remove(householdId, id) {
    const all = loadAll(householdId);
    const next = all.filter((e) => e.id !== id);
    saveAll(householdId, next);
    return { ok: true };
  },
};
