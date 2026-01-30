import React from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../../controllers/DashboardContext.jsx";

export function SettingsPage() {
  const d = useDashboard();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-200">Settings</h1>
            <p className="mt-1 text-sm text-slate-400">Account und App-Einstellungen.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/40"
          >
            Benachrichtigungen öffnen
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold text-slate-200">Aktiver Haushalt</div>
            <div className="mt-1 text-sm text-slate-300">{d.activeHousehold?.name || "—"}</div>
            <div className="mt-2 text-xs text-slate-500">Household-ID: {d.activeHouseholdId || "—"}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold text-slate-200">Hinweis</div>
            <div className="mt-1 text-sm text-slate-300">
              Dein Prisma-Schema enthält aktuell keine persistente Settings-Tabelle. Settings können vorerst clientseitig
              gespeichert werden (localStorage). Später können wir ein UserSettings-Model ergänzen.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Quick Links</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/tasks")}
            className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/40"
          >
            Aufgaben
          </button>
          <button
            type="button"
            onClick={() => navigate("/calendar")}
            className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/40"
          >
            Kalender
          </button>
          <button
            type="button"
            onClick={() => navigate("/shopping")}
            className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/40"
          >
            Einkaufsliste
          </button>
        </div>
      </div>
    </div>
  );
}
