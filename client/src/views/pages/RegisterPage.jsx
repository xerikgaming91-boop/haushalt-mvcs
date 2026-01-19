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
    setErr(""); setOk("");
    try {
      await auth.register({ name: name, email: email, password: password });
      setOk("Registrierung erfolgreich. Bitte einloggen.");
      setTimeout(() => navigate("/login"), 600);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2>Registrieren</h2>
      {err && <div className="badge" style={{ borderColor: "#ef4444" }}>{err}</div>}
      {ok && <div className="badge" style={{ borderColor: "#22c55e" }}>{ok}</div>}
      <form onSubmit={submit} className="row">
        <input className="col" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="col" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="col" placeholder="Passwort (min 8 Zeichen)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="primary" type="submit">Account erstellen</button>
      </form>
      <hr />
      <small className="muted">Schon einen Account? <Link to="/login">Login</Link></small>
    </div>
  );
}
