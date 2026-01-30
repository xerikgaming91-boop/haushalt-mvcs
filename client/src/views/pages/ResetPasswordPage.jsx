import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../services/auth.service.js";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!token) {
      setErr("Kein Token vorhanden. Bitte nutze den Link aus der E-Mail/Server-Konsole.");
      return;
    }
    if (newPassword.length < 8) {
      setErr("Passwort muss mindestens 8 Zeichen haben.");
      return;
    }
    if (newPassword !== confirm) {
      setErr("Passwörter stimmen nicht überein.");
      return;
    }

    try {
      await authService.resetPassword(token, newPassword);
      setMsg("Passwort wurde geändert. Du wirst zum Login weitergeleitet.");
      setNewPassword("");
      setConfirm("");
      setTimeout(() => navigate("/login"), 800);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-lg font-semibold">Passwort zurücksetzen</h2>
      <p className="mt-1 text-sm text-slate-400">Token: {token ? token.slice(0, 10) + "…" : "(fehlt)"}</p>

      {err && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {err}
        </div>
      )}
      {msg && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {msg}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-300">Neues Passwort</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300">Passwort bestätigen</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <button
          className="w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          type="submit"
        >
          Passwort speichern
        </button>
      </form>

      <div className="mt-4 text-sm">
        <Link to="/login" className="text-blue-300 hover:text-blue-200">
          Zurück zum Login
        </Link>
      </div>
    </div>
  );
}
