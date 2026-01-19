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
    // Step by N days
    let cursor = new Date(start);
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
    let weekStart = startOfWeekMonday(start);

    // Iterate weeks
    while (weekStart.getTime() <= toMs && count < HARD_CAP) {
      for (const wd of weekdays) {
        const occurrenceDate = addDays(weekStart, wd);
        const dt = dateWithSameTime(start, occurrenceDate.getFullYear(), occurrenceDate.getMonth(), occurrenceDate.getDate());

        // do not include occurrences before the series start
        if (dt.getTime() < start.getTime()) continue;

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
    // Start at the month of start, step months
    let months = 0;
    while (count < HARD_CAP) {
      const dt = addMonthsKeepDayClamp(start, months, dom, start);

      if (dt.getTime() < start.getTime()) {
        months += interval;
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
