import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../../controllers/DashboardContext.jsx";

export function DashboardPage() {
  const d = useDashboard();

  const stats = useMemo(() => {
    const tasks = d.tasks || [];
    const open = tasks.filter((t) => t.status === "OPEN").length;
    const done = tasks.filter((t) => t.status === "DONE").length;

    const now = Date.now();
    const upcoming = tasks
      .filter((t) => new Date(t.dueAt).getTime() >= now)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 5);

    return { open, done, upcoming };
  }, [d.tasks]);

  if (!d.activeHousehold) {
    return (
      <div className="card">
        <h2>Übersicht</h2>
        <small className="muted">
          Du hast noch keinen Haushalt ausgewählt/angelegt. Bitte gehe zu{" "}
          <Link to="/household">Haushalt</Link>.
        </small>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {d.error && (
        <div className="card" style={{ borderColor: "#ef4444" }}>
          {d.error}
        </div>
      )}

      <div className="card">
        <h2>Übersicht</h2>
        <small className="muted">
          Aktiver Haushalt: <span className="badge">{d.activeHousehold.name}</span>
        </small>

        <hr />

        <div className="row">
          <div className="col card">
            <h3>Offen</h3>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.open}</div>
            <small className="muted">
              <Link to="/tasks">Zu den Aufgaben</Link>
            </small>
          </div>

          <div className="col card">
            <h3>Erledigt</h3>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.done}</div>
            <small className="muted">
              <Link to="/tasks">Aufgaben ansehen</Link>
            </small>
          </div>

          <div className="col card">
            <h3>Kalender</h3>
            <div style={{ fontSize: 28, fontWeight: 700 }}>↗</div>
            <small className="muted">
              <Link to="/calendar">Zum Kalender</Link>
            </small>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Nächste Aufgaben</h2>
        <small className="muted">Die nächsten 5 fälligen Aufgaben (ab jetzt).</small>

        <hr />

        <div style={{ display: "grid", gap: 10 }}>
          {stats.upcoming.map((t) => (
            <div key={t.id} className={"task " + (t.status === "DONE" ? "done" : "")}>
              <div>
                <div style={{ fontWeight: 600 }}>{t.title}</div>
                <small className="muted">
                  Fällig: {new Date(t.dueAt).toLocaleString()}
                  {" · "}
                  {t.assignedTo ? "Zuweisung: " + t.assignedTo.name : "Keine Zuweisung"}
                  {" · "}
                  {t.category ? "Kategorie: " + t.category.name : "Keine Kategorie"}
                </small>
              </div>
            </div>
          ))}
          {stats.upcoming.length === 0 && <small className="muted">Keine anstehenden Aufgaben.</small>}
        </div>

        <hr />

        <Link to="/tasks">Aufgaben verwalten</Link>
      </div>
    </div>
  );
}
