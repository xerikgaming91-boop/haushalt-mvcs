// Recurrence expansion (client-side)
// Weekday convention: 0=Monday ... 6=Sunday

function pad2(n) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year, monthIndex0) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function dateWithSameTime(baseDateTime, y, m0, d) {
  return new Date(
    y,
    m0,
    d,
    baseDateTime.getHours(),
    baseDateTime.getMinutes(),
    baseDateTime.getSeconds(),
    baseDateTime.getMilliseconds()
  );
}

function weekday0Mon(date) {
  // JS getDay: 0=Sun..6=Sat -> convert to 0=Mon..6=Sun
  const d = date.getDay();
  return (d + 6) % 7;
}

function startOfWeekMonday(date) {
  const wd = weekday0Mon(date);
  const res = new Date(date);
  res.setDate(res.getDate() - wd);
  res.setHours(0, 0, 0, 0);
  return res;
}

function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function localDayNumber(d) {
  // Use local noon to avoid DST edge cases around midnight.
  return Math.floor(
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0).getTime() / 86400000
  );
}

function addMonthsKeepDayClamp(base, monthsToAdd, dayOfMonth, timeRef) {
  const y = base.getFullYear();
  const m0 = base.getMonth() + monthsToAdd;

  const target = new Date(y, m0, 1);
  const dim = daysInMonth(target.getFullYear(), target.getMonth());
  const day = Math.min(dayOfMonth, dim);

  return dateWithSameTime(timeRef, target.getFullYear(), target.getMonth(), day);
}

export function isRecurringTask(task) {
  return task.recurrenceType && task.recurrenceType !== "NONE";
}

export function expandTaskToOccurrences(task, from, to) {
  const fromMs = from.getTime();
  const toMs = to.getTime();
  const start = new Date(task.dueAt);
  if (Number.isNaN(start.getTime())) return [];

  const endAt = task.recurrenceEndAt ? new Date(task.recurrenceEndAt) : null;

  const interval = Math.max(1, Number(task.recurrenceInterval || 1));

  const type = task.recurrenceType || "NONE";
  const unit = task.recurrenceUnit || "DAY";

  const byWeekday =
    Array.isArray(task.recurrenceByWeekday) ? task.recurrenceByWeekday : task.recurrenceByWeekday || null;

  const byMonthday =
    typeof task.recurrenceByMonthday === "number" ? task.recurrenceByMonthday : null;

  const out = [];
  const pushIfInRange = (dt) => {
    const ms = dt.getTime();
    if (endAt && ms > endAt.getTime()) return false;
    if (ms >= fromMs && ms <= toMs) {
      out.push({
        key: `${task.id}:${dt.toISOString()}`,
        taskId: task.id,
        dueAt: dt.toISOString(),
        title: task.title,
        description: task.description || null,
        allDay: Boolean(task.allDay),
        assignedTo: task.assignedTo || null,
        category: task.category || null,
        baseTask: task
      });
    }
    return true;
  };

  // Non-recurring
  if (type === "NONE") {
    pushIfInRange(start);
    return out;
  }

  // Safety cap
  const HARD_CAP = 1500;
  let count = 0;

  const effectiveType = type === "CUSTOM" ? unit : type; // CUSTOM uses unit

  if (effectiveType === "DAILY" || effectiveType === "DAY") {
    // Step by N days (jump close to range start to avoid iterating from far in the past)
    const dayDiff = localDayNumber(from) - localDayNumber(start);
    const stepsToFrom = Math.max(0, Math.ceil(dayDiff / interval));
    let cursor = addDays(start, stepsToFrom * interval);

    // If range start is within the same day but earlier than the task time, ensure we don't skip
    // the first valid occurrence.
    if (cursor.getTime() < start.getTime()) cursor = new Date(start);

    // If cursor is still before range start (can happen with DST / rounding), advance once.
    while (cursor.getTime() < fromMs && count < HARD_CAP) {
      cursor = addDays(cursor, interval);
      count++;
    }

    while (cursor.getTime() <= toMs && count < HARD_CAP) {
      if (!pushIfInRange(cursor)) break;
      cursor = addDays(cursor, interval);
      count++;
    }
    return out;
  }

  if (effectiveType === "WEEKLY" || effectiveType === "WEEK") {
    const weekdays =
      Array.isArray(byWeekday) && byWeekday.length
        ? [...byWeekday].sort((a, b) => a - b)
        : [weekday0Mon(start)];

    // Determine the first week start (Mon)
    const seriesWeekStart = startOfWeekMonday(start);
    const rangeWeekStart = startOfWeekMonday(from);

    // Jump close to the requested range. Align by interval weeks.
    const dayDiff = localDayNumber(rangeWeekStart) - localDayNumber(seriesWeekStart);
    const weekDiff = Math.floor(dayDiff / 7);
    const baseSteps = Math.max(0, Math.floor(weekDiff / interval));
    let weekStart = addDays(seriesWeekStart, baseSteps * interval * 7);

    // Ensure we are not still before the range week start.
    while (weekStart.getTime() < rangeWeekStart.getTime() && count < HARD_CAP) {
      weekStart = addDays(weekStart, interval * 7);
      count++;
    }

    // Iterate weeks
    while (weekStart.getTime() <= toMs && count < HARD_CAP) {
      for (const wd of weekdays) {
        const occurrenceDate = addDays(weekStart, wd);
        const dt = dateWithSameTime(
          start,
          occurrenceDate.getFullYear(),
          occurrenceDate.getMonth(),
          occurrenceDate.getDate()
        );

        // do not include occurrences before the series start
        if (dt.getTime() < start.getTime()) continue;

        if (dt.getTime() < fromMs) continue;
        if (dt.getTime() > toMs) continue;
        if (!pushIfInRange(dt)) return out;

        count++;
        if (count >= HARD_CAP) break;
      }

      weekStart = addDays(weekStart, interval * 7);
    }

    return out;
  }

  if (effectiveType === "MONTHLY" || effectiveType === "MONTH") {
    const dom = byMonthday || start.getDate();
    // Start close to the range start month, step by interval months.
    const startMonthIndex = start.getFullYear() * 12 + start.getMonth();
    const fromMonthIndex = from.getFullYear() * 12 + from.getMonth();
    const monthDiff = fromMonthIndex - startMonthIndex;
    const baseSteps = Math.max(0, Math.floor(monthDiff / interval));
    let months = baseSteps * interval;

    // Ensure the computed first candidate is not before range start.
    let first = addMonthsKeepDayClamp(start, months, dom, start);
    while (first.getTime() < fromMs && count < HARD_CAP) {
      months += interval;
      first = addMonthsKeepDayClamp(start, months, dom, start);
      count++;
    }

    while (count < HARD_CAP) {
      const dt = addMonthsKeepDayClamp(start, months, dom, start);

      if (dt.getTime() < start.getTime()) {
        months += interval;
        continue;
      }

      if (dt.getTime() < fromMs) {
        months += interval;
        count++;
        continue;
      }

      if (dt.getTime() > toMs) break;
      if (!pushIfInRange(dt)) break;

      months += interval;
      count++;
    }
    return out;
  }

  // Fallback: treat as non-recurring
  pushIfInRange(start);
  return out;
}

export function expandTasksToOccurrences(tasks, from, to) {
  const all = [];
  for (const t of tasks || []) {
    all.push(...expandTaskToOccurrences(t, from, to));
  }
  all.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  return all;
}

export function localDateKey(isoOrDate) {
  const dt = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
