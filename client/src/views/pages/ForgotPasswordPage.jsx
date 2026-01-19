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
      setMsg("Wenn ein Account mit dieser E-Mail existiert, wurde ein Reset-Link erzeugt. (Im Dev-Modus wird er in der Server-Konsole geloggt.)");
      setEmail("");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <h2>Passwort vergessen</h2>
      <small className="muted">
        Gib deine E-Mail ein. Du erhältst anschließend einen Link zum Zurücksetzen.
      </small>

      <hr />

      {err && <div className="badge" style={{ borderColor: "#ef4444" }}>{err}</div>}
      {msg && <div className="badge" style={{ borderColor: "#22c55e" }}>{msg}</div>}

      <form onSubmit={submit} className="row">
        <input
          className="col"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="primary" type="submit" disabled={!email.trim()}>
          Reset-Link anfordern
        </button>
      </form>

      <hr />
      <small className="muted">
        <Link to="/login">Zurück zum Login</Link>
      </small>
    </div>
  );
}
