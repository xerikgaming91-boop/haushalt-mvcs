import React, { useState } from "react";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useToast } from "../../components/ToastProvider.jsx";

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-6 shadow-lg shadow-black/20">
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-300">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function HouseholdPage() {
  const d = useDashboard();
  const { toast } = useToast();

  const [newName, setNewName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [localErr, setLocalErr] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({ title: "Kopiert", description: "Einladungslink wurde kopiert.", variant: "success" });
    } catch {
      toast({ title: "Hinweis", description: "Konnte nicht automatisch kopieren. Bitte manuell markieren.", variant: "warning" });
    }
  }

  return (
    <div className="space-y-6">
      {(d.error || localErr) && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {localErr || d.error}
        </div>
      )}

      <Card>
        <h2 className="text-lg font-semibold">Haushalt</h2>
        <p className="mt-1 text-sm text-slate-400">Haushalt wählen, anlegen und Mitglieder verwalten.</p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Aktiver Haushalt">
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={d.activeHouseholdId}
              onChange={(e) => d.setActiveHouseholdId(e.target.value)}
            >
              <option value="">— Haushalt wählen —</option>
              {(d.households || []).map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Neuen Haushalt erstellen">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="z. B. Zuhause"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button
                className="rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                disabled={!newName.trim()}
                onClick={async () => {
                  try {
                    setLocalErr("");
                    setInviteLink("");
                    await d.createHousehold(newName.trim());
                    setNewName("");
                    toast({ title: "Erstellt", description: "Haushalt wurde erstellt.", variant: "success" });
                  } catch (e) {
                    setLocalErr(e.message);
                  }
                }}
              >
                Erstellen
              </button>
            </div>
          </Field>
        </div>
      </Card>

      {d.activeHousehold && (
        <Card>
          <h2 className="text-lg font-semibold">Mitglieder</h2>
          <p className="mt-1 text-sm text-slate-400">
            {(d.members || []).length
              ? (d.members || []).map((m) => m.user.name).join(", ")
              : "Keine Mitglieder geladen."}
          </p>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
            <div className="text-sm font-semibold">Einladen</div>
            <p className="mt-1 text-xs text-slate-400">Hinweis: Nur ADMIN kann Einladungen erzeugen (Backend prüft das).</p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="E-Mail (optional)"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <button
                className="rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                onClick={async () => {
                  try {
                    setLocalErr("");
                    const r = await d.createInvite(inviteEmail.trim());
                    setInviteLink(r.link);
                    setInviteEmail("");
                    toast({ title: "Link erzeugt", description: "Einladungslink wurde erstellt.", variant: "success" });
                  } catch (e) {
                    setLocalErr(e.message);
                  }
                }}
              >
                Einladungslink erzeugen
              </button>
            </div>

            {inviteLink && (
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="text-sm font-semibold text-emerald-100">Einladungslink</div>
                <div className="mt-2 break-all text-sm text-emerald-100/90">{inviteLink}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20"
                    onClick={copyLink}
                  >
                    Kopieren
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
