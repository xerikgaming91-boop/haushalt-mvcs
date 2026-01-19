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
    <div className="card" style={{ maxWidth: 520 }}>
      <h2>Login</h2>

      {err && <div className="badge" style={{ borderColor: "#ef4444" }}>{err}</div>}

      <form onSubmit={submit} className="row">
        <input
          className="col"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="col"
          placeholder="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary" type="submit">Einloggen</button>
      </form>

      <hr />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <small className="muted">
          Noch kein Account? <Link to="/register">Registrieren</Link>
        </small>

        <small className="muted">
          <Link to="/forgot">Passwort vergessen?</Link>
        </small>
      </div>
    </div>
  );
}
