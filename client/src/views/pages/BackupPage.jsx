import React, { useRef, useState } from "react";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useBackupController } from "../../controllers/useBackupController.js";

export function BackupPage() {
  const dashboard = useDashboard();
  const backup = useBackupController(dashboard);

  const fileRef = useRef(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const onRestore = async () => {
    const file = fileRef.current?.files?.[0];
    if (!confirmReplace) {
      backup.clearMessages();
      // wir setzen direkt error, um gleiche UX zu haben
      // (Controller kann das auch, aber so ist es “View-only”)
      // -> daher nutzen wir hier nur ein minimal Pattern:
      alert("Bitte bestätige zuerst das Überschreiben (Replace).");
      return;
    }
    await backup.restoreFromFile(file, "replace");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h1 className="text-xl font-semibold text-white">Backup</h1>
        <p className="mt-1 text-sm text-slate-400">
          Exportiere deine Daten als JSON oder stelle sie aus einer Datei wieder her.
        </p>
      </div>

      {(backup.error || backup.success) && (
        <div
          className={[
            "rounded-2xl border p-4 text-sm",
            backup.error
              ? "border-rose-500/20 bg-rose-500/10 text-rose-100"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
          ].join(" ")}
        >
          {backup.error || backup.success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* DOWNLOAD */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-base font-semibold text-white">Backup herunterladen</h2>
          <p className="mt-1 text-sm text-slate-400">
            Optional kannst du einen Haushalt auswählen oder alle exportieren.
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-200">Export</label>
            <select
              value={backup.selectedHouseholdId}
              onChange={(e) => backup.setSelectedHouseholdId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500/50"
            >
              {backup.householdOptions.map((o) => (
                <option key={o.id || "all"} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={backup.download}
            disabled={backup.busy}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {backup.busy ? "Bitte warten…" : "Download"}
          </button>
        </div>

        {/* RESTORE */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-base font-semibold text-white">Backup wiederherstellen</h2>
          <p className="mt-1 text-sm text-slate-400">
            Replace überschreibt deine aktuellen Haushalte (bei denen du Mitglied bist).
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-200">JSON-Datei</label>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/15"
            />
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={confirmReplace}
              onChange={(e) => setConfirmReplace(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-950/40"
            />
            Ich bestätige: Replace überschreibt meine Daten
          </label>

          <button
            onClick={onRestore}
            disabled={backup.busy}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800/40 disabled:opacity-60"
          >
            {backup.busy ? "Bitte warten…" : "Restore (Replace)"}
          </button>
        </div>
      </div>
    </div>
  );
}
