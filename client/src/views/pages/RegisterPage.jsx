import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function RegisterPage({ auth }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    try {
      await auth.register({ name, email, password });
      setOk("Registrierung erfolgreich. Du wirst zum Login weitergeleitet.");
      setTimeout(() => navigate("/login"), 700);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="text-lg font-semibold">Registrieren</h2>
      <p className="mt-1 text-sm text-slate-400">Lege deinen Account an.</p>

      {err && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {err}
        </div>
      )}
      {ok && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {ok}
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-300">Name</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Dein Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

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
            placeholder="Mindestens 8 Zeichen"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button
          className="w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          type="submit"
          disabled={!name.trim() || !email.trim() || password.length < 8}
        >
          Account erstellen
        </button>
      </form>

      <div className="mt-4 text-sm">
        <Link to="/login" className="text-blue-300 hover:text-blue-200">
          Schon einen Account? Login
        </Link>
      </div>
    </div>
  );
}
