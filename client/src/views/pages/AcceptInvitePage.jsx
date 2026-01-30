import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function AcceptInvitePage({ auth }) {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function accept() {
    setErr("");
    setMsg("");
    try {
      const result = await auth.acceptInviteIfPossible(token);
      if (result.requiresLogin) {
        auth.prepareInviteAcceptance(token);
        setMsg("Bitte einloggen. Danach wird die Einladung automatisch angenommen.");
        navigate("/login");
        return;
      }
      setMsg("Einladung angenommen. Weiter zum Dashboard.");
      setTimeout(() => navigate("/"), 700);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-lg font-semibold">Einladung annehmen</h2>
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

      <button
        type="button"
        onClick={accept}
        className="mt-4 w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        disabled={!token}
      >
        Einladung annehmen
      </button>
    </div>
  );
}
