import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useShoppingController } from "../../controllers/useShoppingController.js";
import { useToast } from "../../components/ToastProvider.jsx";
import { useConfirm } from "../../components/ConfirmProvider.jsx";

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-6 shadow-lg shadow-black/20">
      {children}
    </div>
  );
}

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
  const { toast } = useToast();
  const { confirm } = useConfirm();

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
      <Card>
        <h2 className="text-lg font-semibold">Einkaufsliste</h2>
        <p className="mt-2 text-sm text-slate-400">
          Bitte zuerst einen Haushalt auswählen/erstellen unter{" "}
          <Link className="text-blue-300 hover:text-blue-200" to="/household">
            Haushalt
          </Link>
          .
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {combinedError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {combinedError}
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Einkaufsliste</h2>
            <p className="mt-1 text-sm text-slate-400">
              Aktiver Haushalt:{" "}
              <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-200">
                {d.activeHousehold.name}
              </span>
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Offen:{" "}
            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-200">
              {sc.openItems.length}
            </span>{" "}
            Erledigt:{" "}
            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-200">
              {sc.purchasedItems.length}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="md:col-span-3">
            <label className="text-xs font-medium text-slate-300">Artikel</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="z. B. Milch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-300">Menge</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="z. B. 2x"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-xs font-medium text-slate-300">Notiz</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="optional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="md:col-span-1 md:self-end">
            <button
              type="button"
              disabled={!name.trim() || sc.loading}
              className="w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
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
                toast({ title: "Hinzugefügt", description: "Item wurde zur Einkaufsliste hinzugefügt.", variant: "success" });
              }}
            >
              Hinzufügen
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-700 bg-slate-950/40"
              checked={sc.includePurchased}
              onChange={(e) => sc.setIncludePurchased(e.target.checked)}
            />
            Erledigte anzeigen
          </label>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold">Offen</h3>
        <div className="mt-4 space-y-3">
          {sc.loading ? (
            <div className="text-sm text-slate-400">Lade…</div>
          ) : sc.openItems.length === 0 ? (
            <div className="text-sm text-slate-400">Keine offenen Items.</div>
          ) : (
            sc.openItems.map((it) => (
              <div key={it.id} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold break-words">{it.name}</div>
                      {it.quantity ? (
                        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-200">
                          {it.quantity}
                        </span>
                      ) : null}
                    </div>

                    {it.note ? <div className="mt-1 text-sm text-slate-300">{it.note}</div> : null}

                    <div className="mt-2 text-xs text-slate-400">
                      Hinzugefügt von {it.createdBy?.name || "—"} · {fmtTime(it.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-950/60"
                      onClick={async () => {
                        await sc.togglePurchased(it);
                        toast({ title: "Erledigt", description: "Item wurde als erledigt markiert.", variant: "success" });
                      }}
                    >
                      Erledigt
                    </button>

                    <button
                      className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-950/60"
                      onClick={() => {
                        setEditingId(it.id);
                        setEditName(it.name || "");
                        setEditQuantity(it.quantity || "");
                        setEditNote(it.note || "");
                      }}
                    >
                      Bearbeiten
                    </button>

                    <button
                      className="rounded-xl border border-red-600 bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Item löschen?",
                          message: `„${it.name}“ wird dauerhaft gelöscht.`,
                          confirmText: "Löschen",
                          cancelText: "Abbrechen",
                          tone: "danger"
                        });
                        if (!ok) return;
                        await sc.removeItem(it.id);
                        toast({ title: "Gelöscht", description: "Item wurde gelöscht.", variant: "success" });
                      }}
                    >
                      Löschen
                    </button>
                  </div>
                </div>

                {editingId === it.id && (
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                      <div className="md:col-span-3">
                        <label className="text-xs font-medium text-slate-300">Artikel</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-300">Menge</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          placeholder="Menge"
                        />
                      </div>

                      <div className="md:col-span-5">
                        <label className="text-xs font-medium text-slate-300">Notiz</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Notiz"
                        />
                      </div>

                      <div className="md:col-span-5 flex flex-wrap gap-2">
                        <button
                          className="rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                          onClick={async () => {
                            await sc.updateItem(it.id, {
                              name: editName.trim() || it.name,
                              quantity: editQuantity.trim() || null,
                              note: editNote.trim() || null
                            });
                            setEditingId(null);
                            toast({ title: "Gespeichert", description: "Änderungen wurden gespeichert.", variant: "success" });
                          }}
                        >
                          Speichern
                        </button>

                        <button
                          className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-950/60"
                          onClick={() => setEditingId(null)}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {sc.includePurchased && (
        <Card>
          <h3 className="text-base font-semibold">Erledigt</h3>
          <div className="mt-4 space-y-3">
            {sc.purchasedItems.length === 0 ? (
              <div className="text-sm text-slate-400">Noch keine erledigten Items.</div>
            ) : (
              sc.purchasedItems.map((it) => (
                <div key={it.id} className="rounded-2xl border border-slate-800 bg-slate-950/20 p-4 opacity-80">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold break-words line-through">{it.name}</div>
                        {it.quantity ? (
                          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-200">
                            {it.quantity}
                          </span>
                        ) : null}
                      </div>

                      {it.note ? <div className="mt-1 text-sm text-slate-300">{it.note}</div> : null}

                      <div className="mt-2 text-xs text-slate-400">
                        Erledigt von {it.purchasedBy?.name || "—"} · {it.purchasedAt ? fmtTime(it.purchasedAt) : "—"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-950/60"
                        onClick={async () => {
                          await sc.togglePurchased(it);
                          toast({ title: "Wieder offen", description: "Item ist wieder offen.", variant: "success" });
                        }}
                      >
                        Wieder offen
                      </button>

                      <button
                        className="rounded-xl border border-red-600 bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Item löschen?",
                            message: `„${it.name}“ wird dauerhaft gelöscht.`,
                            confirmText: "Löschen",
                            cancelText: "Abbrechen",
                            tone: "danger"
                          });
                          if (!ok) return;
                          await sc.removeItem(it.id);
                          toast({ title: "Gelöscht", description: "Item wurde gelöscht.", variant: "success" });
                        }}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
