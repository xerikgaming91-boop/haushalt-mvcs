import React, { useState } from "react";
import { useDashboard } from "../../controllers/DashboardContext.jsx";

function CreateHousehold({ onCreate }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  return (
    <>
      {err && (
        <div className="badge" style={{ borderColor: "#ef4444", marginBottom: 10 }}>
          {err}
        </div>
      )}
      <div className="row">
        <input
          className="col"
          placeholder="Name (z.B. Zuhause)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="primary"
          disabled={!name.trim()}
          onClick={async () => {
            try {
              setErr("");
              await onCreate(name);
              setName("");
            } catch (e) {
              setErr(e.message);
            }
          }}
        >
          Erstellen
        </button>
      </div>
    </>
  );
}

export function HouseholdPage() {
  const d = useDashboard();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [localErr, setLocalErr] = useState("");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {(d.error || localErr) && (
        <div className="card" style={{ borderColor: "#ef4444" }}>
          {localErr || d.error}
        </div>
      )}

      <div className="card">
        <h2>Haushalt</h2>

        <div className="row">
          <select className="col" value={d.activeHouseholdId} onChange={(e) => d.setActiveHouseholdId(e.target.value)}>
            <option value="">— Haushalt wählen —</option>
            {(d.households || []).map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <hr />

        <h3>Neuen Haushalt erstellen</h3>
        <CreateHousehold
          onCreate={async (name) => {
            setLocalErr("");
            setInviteLink("");
            await d.createHousehold(name);
          }}
        />
      </div>

      {d.activeHousehold && (
        <div className="card">
          <h2>Mitglieder</h2>
          <small className="muted">
            {(d.members || []).length
              ? (d.members || []).map((m) => m.user.name).join(", ")
              : "Keine Mitglieder geladen."}
          </small>

          <hr />

          <h3>Einladen</h3>
          <small className="muted">
            Hinweis: Nur ADMIN kann Einladungen erzeugen (Backend prüft das).
          </small>

          <div className="row" style={{ marginTop: 10 }}>
            <input
              className="col"
              placeholder="E-Mail (optional)"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <button
              className="primary"
              onClick={async () => {
                try {
                  setLocalErr("");
                  const r = await d.createInvite(inviteEmail);
                  setInviteLink(r.link);
                  setInviteEmail("");
                } catch (e) {
                  setLocalErr(e.message);
                }
              }}
            >
              Einladungslink erzeugen
            </button>
          </div>

          {inviteLink && (
            <div style={{ marginTop: 10 }}>
              <div className="badge" style={{ borderColor: "#22c55e", marginBottom: 8 }}>
                Einladungslink erzeugt
              </div>
              <div style={{ wordBreak: "break-all" }}>{inviteLink}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
