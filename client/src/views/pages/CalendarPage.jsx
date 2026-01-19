import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Calendar from "react-calendar";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useTaskRangeController } from "../../controllers/useTaskRangeController.js";
import { localDateKey } from "../../lib/recurrence.js";

function monthRange(activeStartDate) {
  const start = new Date(activeStartDate);
  start.setHours(0, 0, 0, 0);

  const from = new Date(start);
  from.setDate(from.getDate() - 7);

  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  const to = new Date(end);
  to.setDate(to.getDate() + 7);

  return { from, to };
}

export function CalendarPage() {
  const d = useDashboard();

  const [selectedDay, setSelectedDay] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState(() => {
    const x = new Date();
    x.setDate(1);
    x.setHours(0, 0, 0, 0);
    return x;
  });

  const range = useMemo(() => monthRange(activeStartDate), [activeStartDate]);
  const tc = useTaskRangeController(d.activeHouseholdId, range.from, range.to);

  const selectedKey = useMemo(() => localDateKey(selectedDay), [selectedDay]);

  const dayTasks = useMemo(() => {
    return (tc.occurrences || []).filter((o) => localDateKey(o.dueAt) === selectedKey);
  }, [tc.occurrences, selectedKey]);

  if (!d.activeHousehold) {
    return (
      <div className="card">
        <h2>Kalender</h2>
        <small className="muted">
          Bitte zuerst einen Haushalt auswählen/erstellen unter <Link to="/household">Haushalt</Link>.
        </small>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {(d.error || tc.error) && (
        <div className="card" style={{ borderColor: "#ef4444" }}>
          {tc.error || d.error}
        </div>
      )}

      <div className="card calWrap">
        <h2>Kalender</h2>
        <small className="muted">
          Aktiver Haushalt: <span className="badge">{d.activeHousehold.name}</span>
        </small>

        <hr />

        <div className="calendarGrid">
          <section className="calendarPanel">
            <div className="panelHeader">
              <div className="panelTitle">Monatsansicht</div>
              <small className="muted">Unten im Tag: Blau = offen, Grün = erledigt.</small>
            </div>

            <Calendar
              value={selectedDay}
              onChange={setSelectedDay}
              onActiveStartDateChange={({ activeStartDate: asd }) => {
                if (asd) setActiveStartDate(asd);
              }}
              tileClassName={({ date, view }) => {
                if (view !== "month") return "";
                const k = localDateKey(date);
                const s = tc.statsByDay.get(k);
                if (!s) return "";
                if (s.open > 0) return "calTileOpen";
                if (s.done > 0) return "calTileDone";
                return "";
              }}
              tileContent={({ date, view }) => {
                if (view !== "month") return null;
                const k = localDateKey(date);
                const s = tc.statsByDay.get(k);
                if (!s || s.total === 0) return null;

                return (
                  <span className="calIndicators" aria-hidden="true">
                    {s.open > 0 && (
                      <span className="calIndicatorGroup open" title={`Offen: ${s.open}`}>
                        <span className="calIndicatorDot open" />
                        <span className="calIndicatorText">{s.open}</span>
                      </span>
                    )}
                    {s.done > 0 && (
                      <span className="calIndicatorGroup done" title={`Erledigt: ${s.done}`}>
                        <span className="calIndicatorDot done" />
                        <span className="calIndicatorText">{s.done}</span>
                      </span>
                    )}
                  </span>
                );
              }}
            />

            <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
              <small className="muted">
                Legende: <span className="calIndicatorLegend open" /> Offen{" "}
                <span className="calIndicatorLegend done" /> Erledigt
              </small>
            </div>
          </section>

          <section className="calendarPanel">
            <div className="panelHeader">
              <div className="panelTitle">Aufgaben am {selectedDay.toLocaleDateString()}</div>
              <small className="muted">
                Aufgaben erstellst du unter <Link to="/tasks">Aufgaben</Link>.
              </small>
            </div>

            {tc.loading ? (
              <small className="muted">Lade…</small>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {dayTasks.map((o) => (
                  <div key={o.key} className={"task " + (o.status === "DONE" ? "done" : "")}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{o.title}</div>
                      <small className="muted" style={{ wordBreak: "break-word" }}>
                        {new Date(o.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" · "}
                        {o.assignedTo ? o.assignedTo.name : "—"}
                        {" · "}
                        {o.category ? o.category.name : "—"}
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

                {dayTasks.length === 0 && <small className="muted">Keine Aufgaben.</small>}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
