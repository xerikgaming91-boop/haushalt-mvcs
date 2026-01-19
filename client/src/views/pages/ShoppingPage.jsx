import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useShoppingController } from "../../controllers/useShoppingController.js";

function fmtTime(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "";
  }
}

export function ShoppingPage() {
  const d = useDashboard();
  const sc = useShoppingController(d.activeHouseholdId);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editNote, setEditNote] = useState("");

  const hasHousehold = Boolean(d.activeHousehold);

  const combinedError = useMemo(() => sc.error || d.error, [sc.error, d.error]);

  if (!hasHousehold) {
    return (
      <div className="card">
        <h2>Einkaufsliste</h2>
        <small className="muted">
          Bitte zuerst einen Haushalt auswählen/erstellen unter <Link to="/household">Haushalt</Link>.
        </small>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {combinedError && (
        <div className="card" style={{ borderColor: "#ef4444" }}>
          {combinedError}
        </div>
      )}

      <div className="card">
        <h2>Einkaufsliste</h2>
        <small className="muted">
          Aktiver Haushalt: <span className="badge">{d.activeHousehold.name}</span>
        </small>

        <hr />

        <h3>Neues Item</h3>
        <div className="row">
          <input
            className="col"
            placeholder="Artikel (z. B. Milch)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            style={{ width: 180 }}
            placeholder="Menge (z. B. 2x)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <input
            className="col"
            placeholder="Notiz (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="primary"
            disabled={!name.trim() || sc.loading}
            onClick={async () => {
              await sc.createItem({
                householdId: d.activeHouseholdId,
                name: name.trim(),
                quantity: quantity.trim() || null,
                note: note.trim() || null
              });
              setName("");
              setQuantity("");
              setNote("");
            }}
          >
            Hinzufügen
          </button>
        </div>

        <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={sc.includePurchased}
              onChange={(e) => sc.setIncludePurchased(e.target.checked)}
            />
            <small className="muted">Erledigte anzeigen</small>
          </label>

          <div style={{ marginLeft: "auto" }}>
            <small className="muted">
              Offen: <span className="badge">{sc.openItems.length}</span>{" "}
              Erledigt: <span className="badge">{sc.purchasedItems.length}</span>
            </small>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Offen</h3>
        <hr />

        {sc.loading ? (
          <small className="muted">Lade…</small>
        ) : sc.openItems.length === 0 ? (
          <small className="muted">Keine offenen Items.</small>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {sc.openItems.map((it) => (
              <div key={it.id} className="shoppingRow">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, wordBreak: "break-word" }}>
                    {it.name}{" "}
                    {it.quantity ? <span className="badge" style={{ marginLeft: 8 }}>{it.quantity}</span> : null}
                  </div>
                  {it.note ? <small className="muted">{it.note}</small> : null}
                  <div>
                    <small className="muted">
                      Hinzugefügt von {it.createdBy?.name || "—"} · {fmtTime(it.createdAt)}
                    </small>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <button onClick={() => sc.togglePurchased(it)}>Erledigt</button>

                  <button
                    onClick={() => {
                      setEditingId(it.id);
                      setEditName(it.name || "");
                      setEditQuantity(it.quantity || "");
                      setEditNote(it.note || "");
                    }}
                  >
                    Bearbeiten
                  </button>

                  <button className="danger" onClick={() => sc.removeItem(it.id)}>
                    Löschen
                  </button>
                </div>

                {editingId === it.id && (
                  <div className="shoppingEdit">
                    <div className="row">
                      <input className="col" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <input
                        style={{ width: 180 }}
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        placeholder="Menge"
                      />
                    </div>
                    <div className="row" style={{ marginTop: 10 }}>
                      <input
                        className="col"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Notiz"
                      />
                      <button
                        className="primary"
                        onClick={async () => {
                          await sc.updateItem(it.id, {
                            name: editName.trim() || it.name,
                            quantity: editQuantity.trim() || null,
                            note: editNote.trim() || null
                          });
                          setEditingId(null);
                        }}
                      >
                        Speichern
                      </button>
                      <button onClick={() => setEditingId(null)}>Abbrechen</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {sc.includePurchased && (
        <div className="card">
          <h3>Erledigt</h3>
          <hr />

          {sc.purchasedItems.length === 0 ? (
            <small className="muted">Noch keine erledigten Items.</small>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {sc.purchasedItems.map((it) => (
                <div key={it.id} className="shoppingRow purchased">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, wordBreak: "break-word" }}>
                      {it.name}{" "}
                      {it.quantity ? <span className="badge" style={{ marginLeft: 8 }}>{it.quantity}</span> : null}
                    </div>
                    {it.note ? <small className="muted">{it.note}</small> : null}
                    <div>
                      <small className="muted">
                        Erledigt von {it.purchasedBy?.name || "—"} · {it.purchasedAt ? fmtTime(it.purchasedAt) : "—"}
                      </small>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <button onClick={() => sc.togglePurchased(it)}>Wieder offen</button>
                    <button className="danger" onClick={() => sc.removeItem(it.id)}>
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
