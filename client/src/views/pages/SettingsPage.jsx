import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftOnRectangleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useDashboard } from "../../controllers/DashboardContext.jsx";

export function SettingsPage({ auth }) {
  const navigate = useNavigate();
  const d = useDashboard();

  const me = auth?.me || null;

  const [name, setName] = useState(me?.name || "");
  const [email, setEmail] = useState(me?.email || "");

  const [status, setStatus] = useState({ type: "", msg: "" }); // type: "ok" | "err" | ""
  const [saving, setSaving] = useState(false);

  const householdLabel = useMemo(() => {
    if (!d.activeHousehold) return "—";
    return d.activeHousehold.name;
  }, [d.activeHousehold]);

  const doLogout = async () => {
    try {
      if (auth?.logout) await auth.logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  // Optional: wenn du später ein Backend-Endpoint für Profilupdate hast,
  // kann man hier auth.updateProfile(...) oder api.put("/me", ...) einbauen.
  const saveProfile = async () => {
    setStatus({ type: "", msg: "" });
    setSaving(true);

    try {
      // Kein Endpoint im aktuellen Code bekannt -> nur UI
      // Hier würdest du z.B.:
      // await auth.updateProfile({ name, email });

      await new Promise((r) => setTimeout(r, 300));
      setStatus({ type: "ok", msg: "Gespeichert (UI). Wenn du ein /me Update-Endpoint hast, hänge ich es direkt dran." });
    } catch (e) {
      setStatus({ type: "err", msg: e?.message || "Speichern fehlgeschlagen." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="tw-card">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <p className="mt-1 text-sm text-slate-400">
          Account, aktiver Haushalt und Session.
        </p>
      </div>

      {status.type === "ok" ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <div className="flex items-start gap-2">
            <CheckCircleIcon className="h-5 w-5 mt-0.5" />
            <div>{status.msg}</div>
          </div>
        </div>
      ) : null}

      {status.type === "err" ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 mt-0.5" />
            <div>{status.msg}</div>
          </div>
        </div>
      ) : null}

      {/* Profile */}
      <div className="tw-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Profil</h3>
            <p className="mt-1 text-xs text-slate-400">UI-Form (Backend-Update kann ich dir direkt anbinden).</p>
          </div>

          <button
            type="button"
            className="tw-btn tw-btn-primary"
            onClick={saveProfile}
            disabled={saving}
          >
            {saving ? "Speichert…" : "Speichern"}
          </button>
        </div>

        <hr className="tw-divider" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="tw-label">Name</label>
            <input
              className="tw-input mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name"
            />
          </div>

          <div>
            <label className="tw-label">E-Mail</label>
            <input
              className="tw-input mt-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Aktuell eingeloggter User (read-only aus Session):{" "}
          <span className="tw-pill tw-pill-muted">{me?.email || "—"}</span>
        </p>
      </div>

      {/* Household info */}
      <div className="tw-card">
        <h3 className="text-sm font-semibold text-white">Haushalt</h3>
        <p className="mt-1 text-xs text-slate-400">Übersicht über den aktuellen Context.</p>

        <hr className="tw-divider" />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="tw-card-soft">
            <p className="text-xs font-semibold text-slate-400">Aktiver Haushalt</p>
            <p className="mt-1 text-sm font-semibold text-white">{householdLabel}</p>
          </div>

          <div className="tw-card-soft">
            <p className="text-xs font-semibold text-slate-400">Haushalte</p>
            <p className="mt-1 text-sm font-semibold text-white">{(d.households || []).length}</p>
          </div>

          <div className="tw-card-soft">
            <p className="text-xs font-semibold text-slate-400">Mitglieder</p>
            <p className="mt-1 text-sm font-semibold text-white">{(d.members || []).length}</p>
          </div>
        </div>
      </div>

      {/* Session / Logout */}
      <div className="tw-card">
        <h3 className="text-sm font-semibold text-white">Session</h3>
        <p className="mt-1 text-xs text-slate-400">Abmelden / Session beenden.</p>

        <hr className="tw-divider" />

        <button type="button" className="tw-btn tw-btn-danger" onClick={doLogout}>
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
