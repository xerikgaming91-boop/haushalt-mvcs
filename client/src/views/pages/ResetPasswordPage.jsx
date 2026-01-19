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
      setTimeout(() => navigate("/login"), 700);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <h2>Passwort zurücksetzen</h2>
      <small className="muted">
        Token: {token ? token.slice(0, 10) + "..." : "(fehlt)"}{" "}
      </small>

      <hr />

      {err && <div className="badge" style={{ borderColor: "#ef4444" }}>{err}</div>}
      {msg && <div className="badge" style={{ borderColor: "#22c55e" }}>{msg}</div>}

      <form onSubmit={submit} className="row">
        <input
          className="col"
          placeholder="Neues Passwort"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          className="col"
          placeholder="Neues Passwort bestätigen"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button className="primary" type="submit">Passwort speichern</button>
      </form>

      <hr />
      <small className="muted">
        <Link to="/login">Zurück zum Login</Link>
      </small>
    </div>
  );
}
