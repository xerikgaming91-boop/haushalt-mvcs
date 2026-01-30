import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function LoginPage({ auth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      await auth.login({ email, password });
      navigate("/");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Login</h2>
          <p className="mt-1 text-sm text-slate-400">Mit E-Mail und Passwort anmelden.</p>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {err}
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
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300">Passwort</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          className="w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          type="submit"
          disabled={!email.trim() || !password.trim()}
        >
          Einloggen
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to="/register" className="text-blue-300 hover:text-blue-200">
          Noch kein Account? Registrieren
        </Link>
        <Link to="/forgot" className="text-slate-300 hover:text-slate-200">
          Passwort vergessen?
        </Link>
      </div>
    </div>
  );
}
