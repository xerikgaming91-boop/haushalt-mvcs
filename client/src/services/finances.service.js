// client/src/services/finances.service.js
// MVP: localStorage Storage (pro Haushalt), jetzt inkl. wiederkehrender Buchungen (Serie).
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

    out.push({
      // occurrence id is unique per date
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
    });
  };

  if (rec.type === "DAILY") {
    // find first occurrence >= from
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
    // Determine weekdays: if not provided use weekday of start date
    const wds = rec.byWeekday && rec.byWeekday.length ? rec.byWeekday : [weekdayMon0(startDate)];

    // week anchor: Monday of start week
    const startWeek = new Date(startDate);
    startWeek.setDate(startWeek.getDate() - weekdayMon0(startWeek)); // back to Monday

    // find first week >= from (step interval weeks)
    let week = new Date(startWeek);

    if (from && from > toISODate(startDate)) {
      // compute weeks difference from startWeek to fromDate
      const fromWeek = new Date(fromDate);
      fromWeek.setDate(fromWeek.getDate() - weekdayMon0(fromWeek));
      const diffWeeks = Math.floor((fromWeek - startWeek) / (7 * 24 * 3600 * 1000));
      const steps = Math.floor(diffWeeks / rec.interval);
      week = addDaysDate(startWeek, steps * rec.interval * 7);
      while (week < fromWeek) week = addDaysDate(week, rec.interval * 7);
    }

    while (week <= toDate) {
      // add occurrences for each weekday in this week
      for (const wd of wds) {
        const occ = addDaysDate(week, wd); // Monday + wd
        if (occ < startDate) continue;
        if (occ > toDate) continue;
        pushOcc(occ);
      }
      week = addDaysDate(week, rec.interval * 7);
    }

    // sort occurrences within range
    out.sort((a, b) => (a.date < b.date ? 1 : -1));
    return out;
  }

  if (rec.type === "MONTHLY") {
    // day in month: byMonthday or day of start
    const day = rec.byMonthday || new Date(startYMD + "T00:00:00").getDate();

    // first occurrence month = start month, at `day`, but not before start date
    let d = new Date(startDate);
    d.setDate(1);
    d.setDate(Math.min(day, 31));
    // if the chosen day produced rollover, clamp later
    if (d.getMonth() !== new Date(startDate).getMonth()) {
      d.setDate(0);
    }

    // ensure >= start date (if day earlier than start day)
    if (d < startDate) {
      d = addMonthsDate(d, rec.interval);
      d.setDate(1);
      d.setDate(Math.min(day, 31));
      if (d.getDate() !== Math.min(day, 31)) d.setDate(0);
    }

    // move forward to from
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
          });
        }
      } else {
        // recurring template: expand occurrences
        items.push(...expandRecurring(e, from, to));
      }
    }

    // newest first
    items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return { items };
  },

  /**
   * Create entry or recurring template
   * dto: {
   *  householdId,
   *  type: "INCOME"|"EXPENSE",
   *  title,
   *  amountCents,
   *  date (YYYY-MM-DD start/one-time),
   *  note,
   *  recurrence?: { type: NONE|DAILY|WEEKLY|MONTHLY, interval, byWeekday, byMonthday, endDate }
   * }
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
