// client/src/services/financesStorage.service.js

const KEY_ENTRIES = (householdId) => `hh_finances_entries_v2:${householdId}`;
const KEY_META = (householdId) => `hh_finances_meta_v2:${householdId}`;
const KEY_SERIES = (householdId) => `hh_finances_series_v2:${householdId}`;
const KEY_EX = (householdId) => `hh_finances_ex_v2:${householdId}`;

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function parseMoneyToCents(value) {
  if (typeof value === "number") return Math.round(value * 100);

  const s = String(value ?? "").trim();
  if (!s) return 0;

  // "1.234,56" -> "1234.56"
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function toISODate(dateLike) {
  // YYYY-MM-DD
  if (!dateLike) return new Date().toISOString().slice(0, 10);
  if (typeof dateLike === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateLike)) return dateLike;
    const d = new Date(dateLike);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  }
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function normalizeEntry(raw, householdId) {
  const e = { ...raw };
  e.id = e.id || makeId();
  e.householdId = e.householdId || householdId;

  e.date = toISODate(e.date || e.bookingDate || e.at || e.createdAt);
  e.title = e.title || e.name || e.text || "Buchung";

  const t = String(e.type || e.kind || "").toUpperCase();
  if (t === "INCOME" || t === "EXPENSE") e.type = t;
  else e.type = "EXPENSE";

  if (typeof e.amountCents !== "number") {
    e.amountCents = Math.abs(parseMoneyToCents(e.amount ?? e.value ?? 0));
  } else {
    e.amountCents = Math.abs(e.amountCents);
  }

  e.note = e.note || "";
  return e;
}

function normalizeSeries(raw, householdId) {
  const s = { ...raw };
  s.id = s.id || makeId();
  s.householdId = s.householdId || householdId;

  s.title = s.title || "Serie";
  s.note = s.note || "";

  const t = String(s.type || "").toUpperCase();
  s.type = t === "INCOME" || t === "EXPENSE" ? t : "EXPENSE";

  if (typeof s.amountCents !== "number") s.amountCents = Math.abs(parseMoneyToCents(s.amount ?? 0));
  else s.amountCents = Math.abs(s.amountCents);

  s.startDate = toISODate(s.startDate || s.from || s.date);
  s.endDate = s.endDate ? toISODate(s.endDate) : null;

  // rule:
  // { freq: "MONTHLY"|"WEEKLY"|"YEARLY", interval: 1, dayOfMonth?: 1-31, weekday?: 0-6, month?: 1-12 }
  const rule = s.rule && typeof s.rule === "object" ? { ...s.rule } : {};
  const freq = String(rule.freq || s.freq || "MONTHLY").toUpperCase();
  rule.freq = freq === "WEEKLY" || freq === "YEARLY" ? freq : "MONTHLY";
  rule.interval = Number(rule.interval || 1);
  if (!Number.isFinite(rule.interval) || rule.interval < 1) rule.interval = 1;

  const start = new Date(`${s.startDate}T00:00:00.000Z`);
  const dom = start.getUTCDate();
  const wd = start.getUTCDay();
  const mo = start.getUTCMonth() + 1;

  if (rule.freq === "MONTHLY") rule.dayOfMonth = Number(rule.dayOfMonth || dom);
  if (rule.freq === "WEEKLY") rule.weekday = Number(rule.weekday ?? wd);
  if (rule.freq === "YEARLY") {
    rule.month = Number(rule.month || mo);
    rule.dayOfMonth = Number(rule.dayOfMonth || dom);
  }

  s.rule = rule;
  return s;
}

function normalizeException(raw, householdId) {
  const ex = { ...raw };
  ex.id = ex.id || `${ex.seriesId}:${toISODate(ex.date)}`;
  ex.householdId = ex.householdId || householdId;
  ex.seriesId = ex.seriesId || "";
  ex.date = toISODate(ex.date);
  ex.kind = String(ex.kind || "SKIP").toUpperCase() === "OVERRIDE" ? "OVERRIDE" : "SKIP";

  if (ex.kind === "OVERRIDE") {
    const o = ex.override && typeof ex.override === "object" ? { ...ex.override } : {};
    if (o.amountCents == null) o.amountCents = parseMoneyToCents(o.amount ?? 0);
    o.amountCents = Math.abs(Number(o.amountCents || 0));
    if (o.type) {
      const t = String(o.type).toUpperCase();
      o.type = t === "INCOME" || t === "EXPENSE" ? t : undefined;
    }
    ex.override = o;
  } else {
    ex.override = undefined;
  }

  return ex;
}

export const financesStorageService = {
  // ------- Meta -------
  getMeta(householdId) {
    const meta = safeJsonParse(localStorage.getItem(KEY_META(householdId)), null);
    const safe = meta && typeof meta === "object" ? meta : {};
    return {
      startBalanceCents: typeof safe.startBalanceCents === "number" ? safe.startBalanceCents : 0,
    };
  },

  setMeta(householdId, partial) {
    const current = this.getMeta(householdId);
    const next = { ...current, ...(partial || {}) };
    localStorage.setItem(KEY_META(householdId), JSON.stringify(next));
    return next;
  },

  // ------- Entries -------
  listEntries(householdId) {
    const arr = safeJsonParse(localStorage.getItem(KEY_ENTRIES(householdId)), []);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => normalizeEntry(x, householdId));
  },

  saveEntries(householdId, entries) {
    localStorage.setItem(KEY_ENTRIES(householdId), JSON.stringify(entries));
  },

  upsertEntry(householdId, entry) {
    const entries = this.listEntries(householdId);
    const normalized = normalizeEntry(entry, householdId);

    const idx = entries.findIndex((x) => x.id === normalized.id);
    if (idx >= 0) entries[idx] = normalized;
    else entries.push(normalized);

    entries.sort((a, b) => a.date.localeCompare(b.date));
    this.saveEntries(householdId, entries);
    return normalized;
  },

  deleteEntry(householdId, entryId) {
    const entries = this.listEntries(householdId).filter((x) => x.id !== entryId);
    this.saveEntries(householdId, entries);
    return true;
  },

  // ------- Series -------
  listSeries(householdId) {
    const arr = safeJsonParse(localStorage.getItem(KEY_SERIES(householdId)), []);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => normalizeSeries(x, householdId));
  },

  saveSeries(householdId, series) {
    localStorage.setItem(KEY_SERIES(householdId), JSON.stringify(series));
  },

  upsertSeries(householdId, series) {
    const list = this.listSeries(householdId);
    const normalized = normalizeSeries(series, householdId);

    const idx = list.findIndex((x) => x.id === normalized.id);
    if (idx >= 0) list[idx] = normalized;
    else list.push(normalized);

    // sort by startDate
    list.sort((a, b) => a.startDate.localeCompare(b.startDate));
    this.saveSeries(householdId, list);
    return normalized;
  },

  deleteSeries(householdId, seriesId) {
    const list = this.listSeries(householdId).filter((x) => x.id !== seriesId);
    this.saveSeries(householdId, list);

    // delete linked exceptions
    const ex = this.listExceptions(householdId).filter((x) => x.seriesId !== seriesId);
    this.saveExceptions(householdId, ex);

    return true;
  },

  // ------- Exceptions -------
  listExceptions(householdId) {
    const arr = safeJsonParse(localStorage.getItem(KEY_EX(householdId)), []);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => normalizeException(x, householdId));
  },

  saveExceptions(householdId, exceptions) {
    localStorage.setItem(KEY_EX(householdId), JSON.stringify(exceptions));
  },

  upsertException(householdId, exception) {
    const list = this.listExceptions(householdId);
    const normalized = normalizeException(exception, householdId);

    const idx = list.findIndex((x) => x.id === normalized.id);
    if (idx >= 0) list[idx] = normalized;
    else list.push(normalized);

    list.sort((a, b) => a.date.localeCompare(b.date));
    this.saveExceptions(householdId, list);
    return normalized;
  },

  deleteException(householdId, seriesId, dateISO) {
    const id = `${seriesId}:${toISODate(dateISO)}`;
    const list = this.listExceptions(householdId).filter((x) => x.id !== id);
    this.saveExceptions(householdId, list);
    return true;
  },

  // helper
  parseMoneyToCents,
  toISODate,
};
