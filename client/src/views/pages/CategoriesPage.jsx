import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../../controllers/DashboardContext.jsx";

export function CategoriesPage() {
  const d = useDashboard();

  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#3b82f6");
  const [localErr, setLocalErr] = useState("");

  if (!d.activeHousehold) {
    return (
      <div className="card">
        <h2>Kategorien</h2>
        <small className="muted">
          Bitte zuerst einen Haushalt auswählen/erstellen unter <Link to="/household">Haushalt</Link>.
        </small>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {(d.error || localErr) && (
        <div className="card" style={{ borderColor: "#ef4444" }}>
          {localErr || d.error}
        </div>
      )}

      <div className="card">
        <h2>Kategorien</h2>
        <small className="muted">
          Aktiver Haushalt: <span className="badge">{d.activeHousehold.name}</span>
        </small>

        <hr />

        <h3>Neue Kategorie</h3>
        <div className="row">
          <input
            className="col"
            placeholder="Kategorie"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <input style={{ width: 90 }} type="color" value={categoryColor} onChange={(e) => setCategoryColor(e.target.value)} />
          <button
            className="primary"
            disabled={!categoryName.trim()}
            onClick={async () => {
              try {
                setLocalErr("");
                await d.createCategory({ name: categoryName, color: categoryColor });
                setCategoryName("");
              } catch (e) {
                setLocalErr(e.message);
              }
            }}
          >
            Hinzufügen
          </button>
        </div>

        <hr />

        <h3>Liste</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(d.categories || []).map((c) => (
            <span key={c.id} className="badge" style={{ borderColor: c.color || "#334155" }}>
              {c.name}
            </span>
          ))}
          {(!d.categories || d.categories.length === 0) && <small className="muted">Noch keine Kategorien.</small>}
        </div>
      </div>
    </div>
  );
}
