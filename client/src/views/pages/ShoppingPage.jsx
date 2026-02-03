import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  ArrowUturnLeftIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";

import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useShoppingController } from "../../controllers/useShoppingController.js";

import { SlideOver } from "../../components/SlideOver.jsx";
import { ConfirmDialog } from "../../components/ConfirmDialog.jsx";

function fmtTime(d) {
  try {
    return new Date(d).toLocaleString("de-DE");
  } catch {
    return "";
  }
}

export function ShoppingPage() {
  const d = useDashboard();
  const sc = useShoppingController(d.activeHouseholdId);

  const hasHousehold = Boolean(d.activeHousehold);

  const combinedError = useMemo(() => sc.error || d.error, [sc.error, d.error]);

  // SlideOver state (Create/Edit)
  const [panelOpen, setPanelOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreate = () => {
    setMode("create");
    setEditingItem(null);
    setName("");
    setQuantity("");
    setNote("");
    setPanelOpen(true);
  };

  const openEdit = (it) => {
    setMode("edit");
    setEditingItem(it);
    setName(it?.name || "");
    setQuantity(it?.quantity || "");
    setNote(it?.note || "");
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingItem(null);
  };

  const saveItem = async () => {
    if (!name.trim()) return;

    if (mode === "create") {
      await sc.createItem({
        householdId: d.activeHouseholdId,
        name: name.trim(),
        quantity: quantity.trim() || null,
        note: note.trim() || null,
      });
      closePanel();
      setName("");
      setQuantity("");
      setNote("");
      return;
    }

    if (mode === "edit" && editingItem?.id) {
      await sc.updateItem(editingItem.id, {
        name: name.trim() || editingItem.name,
        quantity: quantity.trim() || null,
        note: note.trim() || null,
      });
      closePanel();
    }
  };

  const askDelete = (it) => {
    setDeleteTarget(it);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!deleteTarget?.id) return;
    await sc.removeItem(deleteTarget.id);
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  if (!hasHousehold) {
    return (
      <div className="tw-card">
        <h2 className="text-lg font-semibold text-white">Einkauf</h2>
        <p className="mt-2 text-sm text-slate-400">
          Bitte zuerst einen Haushalt auswählen/erstellen unter{" "}
          <Link className="text-sky-300 hover:text-sky-200" to="/household">
            Haushalt
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {combinedError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {combinedError}
        </div>
      ) : null}

      {/* Header */}
      <div className="tw-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-200">
              <ShoppingCartIcon className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">Einkaufsliste</h2>
              <p className="mt-1 text-sm text-slate-400">
                Aktiver Haushalt:{" "}
                <span className="tw-pill tw-pill-muted">{d.activeHousehold.name}</span>
              </p>
            </div>
          </div>

          <button type="button" className="tw-btn tw-btn-primary" onClick={openCreate}>
            <PlusIcon className="h-5 w-5" />
            Neues Item
          </button>
        </div>

        <hr className="tw-divider" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2">
            <input
              className="tw-checkbox"
              type="checkbox"
              checked={sc.includePurchased}
              onChange={(e) => sc.setIncludePurchased(e.target.checked)}
            />
            <span className="text-sm text-slate-300">Erledigte anzeigen</span>
          </label>

          <div className="flex items-center gap-2 text-sm">
            <span className="tw-pill tw-pill-muted">Offen: {sc.openItems.length}</span>
            <span className="tw-pill tw-pill-muted">Erledigt: {sc.purchasedItems.length}</span>
          </div>
        </div>
      </div>

      {/* Offen */}
      <div className="tw-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Offen</h3>
            <p className="mt-1 text-xs text-slate-400">Alles was noch besorgt werden muss.</p>
          </div>
        </div>

        <hr className="tw-divider" />

        {sc.loading ? (
          <p className="text-sm text-slate-400">Lade…</p>
        ) : sc.openItems.length === 0 ? (
          <p className="text-sm text-slate-400">Keine offenen Items.</p>
        ) : (
          <ul role="list" className="divide-y divide-white/10">
            {sc.openItems.map((it) => (
              <li key={it.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{it.name}</p>
                    {it.quantity ? <span className="tw-pill tw-pill-muted">{it.quantity}</span> : null}
                  </div>

                  {it.note ? <p className="mt-1 text-sm text-slate-300">{it.note}</p> : null}

                  <p className="mt-1 text-xs text-slate-500">
                    Hinzugefügt von {it.createdBy?.name || "—"} · {fmtTime(it.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button type="button" className="tw-btn" onClick={() => sc.togglePurchased(it)}>
                    <CheckIcon className="h-5 w-5" />
                    Erledigt
                  </button>

                  <button type="button" className="tw-btn" onClick={() => openEdit(it)}>
                    <PencilSquareIcon className="h-5 w-5" />
                    Bearbeiten
                  </button>

                  <button type="button" className="tw-btn tw-btn-danger" onClick={() => askDelete(it)}>
                    <TrashIcon className="h-5 w-5" />
                    Löschen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Erledigt */}
      {sc.includePurchased ? (
        <div className="tw-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Erledigt</h3>
              <p className="mt-1 text-xs text-slate-400">Bereits gekauft/erledigt.</p>
            </div>
          </div>

          <hr className="tw-divider" />

          {sc.purchasedItems.length === 0 ? (
            <p className="text-sm text-slate-400">Noch keine erledigten Items.</p>
          ) : (
            <ul role="list" className="divide-y divide-white/10">
              {sc.purchasedItems.map((it) => (
                <li key={it.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{it.name}</p>
                      {it.quantity ? <span className="tw-pill tw-pill-muted">{it.quantity}</span> : null}
                      <span className="tw-pill tw-pill-done">Erledigt</span>
                    </div>

                    {it.note ? <p className="mt-1 text-sm text-slate-300">{it.note}</p> : null}

                    <p className="mt-1 text-xs text-slate-500">
                      Erledigt von {it.purchasedBy?.name || "—"} ·{" "}
                      {it.purchasedAt ? fmtTime(it.purchasedAt) : "—"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button type="button" className="tw-btn" onClick={() => sc.togglePurchased(it)}>
                      <ArrowUturnLeftIcon className="h-5 w-5" />
                      Wieder offen
                    </button>

                    <button type="button" className="tw-btn tw-btn-danger" onClick={() => askDelete(it)}>
                      <TrashIcon className="h-5 w-5" />
                      Löschen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* Create/Edit SlideOver */}
      <SlideOver
        open={panelOpen}
        title={mode === "create" ? "Neues Item" : "Item bearbeiten"}
        subtitle={mode === "create" ? "Füge etwas zur Einkaufsliste hinzu." : "Ändere Name, Menge oder Notiz."}
        onClose={closePanel}
        footer={
          <div className="flex items-center justify-between gap-3">
            <button type="button" className="tw-btn tw-btn-ghost" onClick={closePanel}>
              Abbrechen
            </button>

            <button
              type="button"
              className="tw-btn tw-btn-primary"
              disabled={!name.trim() || sc.loading}
              onClick={saveItem}
            >
              Speichern
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="tw-card-soft">
            <label className="tw-label">Artikel</label>
            <input
              className="tw-input mt-2"
              placeholder="z. B. Milch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="tw-card-soft">
            <label className="tw-label">Menge (optional)</label>
            <input
              className="tw-input mt-2"
              placeholder="z. B. 2x"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="tw-card-soft">
            <label className="tw-label">Notiz (optional)</label>
            <textarea
              className="tw-textarea mt-2"
              placeholder="z. B. fettarm, Marke egal…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {mode === "edit" && editingItem ? (
            <p className="text-xs text-slate-500">
              Erstellt: {fmtTime(editingItem.createdAt)} · von {editingItem.createdBy?.name || "—"}
            </p>
          ) : null}
        </div>
      </SlideOver>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmOpen}
        title="Item löschen?"
        message={`“${deleteTarget?.name || ""}” löschen? Das kann nicht rückgängig gemacht werden.`}
        confirmText="Löschen"
        cancelText="Abbrechen"
        variant="danger"
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={doDelete}
      />
    </div>
  );
}
