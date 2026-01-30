import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/auth.service.js";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    try {
      await authService.forgotPassword(email);
      setMsg(
        "Wenn ein Account mit dieser E-Mail existiert, wurde ein Reset-Link erzeugt (im Dev-Modus steht er in der Server-Konsole)."
      );
      setEmail("");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-lg font-semibold">Passwort vergessen</h2>
      <p className="mt-1 text-sm text-slate-400">Gib deine E-Mail ein, um einen Reset-Link anzufordern.</p>

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
          <label className="text-xs font-medium text-slate-300">E-Mail</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          className="w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          type="submit"
          disabled={!email.trim()}
        >
          Reset-Link anfordern
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
