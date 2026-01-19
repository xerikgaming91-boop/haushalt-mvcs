import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function AcceptInvitePage({ auth }) {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function accept() {
    setErr(""); setMsg("");
    try {
      const result = await auth.acceptInviteIfPossible(token);
      if (result.requiresLogin) {
        auth.prepareInviteAcceptance(token);
        setMsg("Bitte einloggen. Danach wird die Einladung automatisch angenommen.");
        navigate("/login");
        return;
      }
      setMsg("Einladung angenommen. Weiter zum Dashboard.");
      setTimeout(() => navigate("/"), 600);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <h2>Einladung annehmen</h2>
      <small className="muted">Token: {token ? token.slice(0, 10) + "..." : "(fehlt)"}</small>
      <hr />
      {err && <div className="badge" style={{ borderColor: "#ef4444" }}>{err}</div>}
      {msg && <div className="badge" style={{ borderColor: "#22c55e" }}>{msg}</div>}
      <button className="primary" onClick={accept}>Einladung annehmen</button>
    </div>
  );
}
