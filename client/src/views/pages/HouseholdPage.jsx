// client/src/views/pages/HouseholdPage.jsx
import React, { useMemo, useState } from "react";
import {
  PlusIcon,
  UserPlusIcon,
  ClipboardIcon,
  CheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { SlideOver } from "../../components/SlideOver.jsx";

function RoleBadge({ role }) {
  const cls =
    role === "ADMIN"
      ? "tw-pill border-amber-500/30 bg-amber-500/10 text-amber-100"
      : "tw-pill tw-pill-muted";
  return <span className={cls}>{role}</span>;
}

export function HouseholdPage() {
  const d = useDashboard();

  const [localErr, setLocalErr] = useState("");
  const [localOk, setLocalOk] = useState("");

  // Create Household (SlideOver)
  const [createOpen, setCreateOpen] = useState(false);
  const [hhName, setHhName] = useState("");

  // Invite (SlideOver)
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const households = d.households || [];
  const members = d.members || [];
  const active = d.activeHousehold;

  const memberCount = useMemo(() => members.length, [members]);
  const adminCount = useMemo(() => members.filter((m) => m.role === "ADMIN").length, [members]);

  const resetMessages = () => {
    setLocalErr("");
    setLocalOk("");
  };

  const createHousehold = async () => {
    resetMessages();
    setInviteLink("");
    try {
      const name = hhName.trim();
      if (!name) return;
      await d.createHousehold(name);
      setHhName("");
      setCreateOpen(false);
      setLocalOk("Haushalt erstellt.");
    } catch (e) {
      setLocalErr(e?.message || "Erstellen fehlgeschlagen.");
    }
  };

  const createInvite = async () => {
    resetMessages();
    setCopied(false);
    try {
      if (!d.activeHouseholdId) throw new Error("Kein Haushalt ausgewählt.");
      const r = await d.createInvite(inviteEmail);
      setInviteLink(r.link);
      setLocalOk("Einladungslink erzeugt.");
    } catch (e) {
      setLocalErr(e?.message || "Einladung fehlgeschlagen.");
    }
  };

  const copyInvite = async () => {
    if (!inviteLink) return;
    setCopied(false);
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setLocalOk("Link kopiert.");
    } catch {
      // Fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = inviteLink;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setLocalOk("Link kopiert.");
      } catch {
        setLocalErr("Kopieren nicht möglich. Bitte manuell markieren/kopieren.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {(d.error || localErr) && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {localErr || d.error}
        </div>
      )}

      {localOk && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {localOk}
        </div>
      )}

      {/* Header */}
      <div className="tw-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Haushalt</h2>
            <p className="mt-1 text-sm text-slate-400">
              Verwalte Haushalte, Mitglieder und Einladungen.
            </p>
          </div>

          <button type="button" className="tw-btn tw-btn-primary" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-5 w-5" />
            Neuer Haushalt
          </button>
        </div>
      </div>

      {/* Household selection / overview */}
      <div className="tw-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Haushalte</h3>
            <p className="mt-1 text-xs text-slate-400">
              Auswahl ist auch in der Sidebar möglich – hier zusätzlich als Übersicht.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="tw-pill tw-pill-muted">
              {households.length} Haushalt(e)
            </span>
          </div>
        </div>

        <hr className="tw-divider" />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="tw-label">Aktiver Haushalt</label>
            <select
              className="tw-select mt-2"
              value={d.activeHouseholdId || ""}
              onChange={(e) => {
                resetMessages();
                setInviteLink("");
                setInviteEmail("");
                d.setActiveHouseholdId(e.target.value);
              }}
            >
              <option value="">— Haushalt wählen —</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            {!households.length ? (
              <p className="mt-2 text-xs text-slate-500">
                Noch keine Haushalte vorhanden. Erstelle einen neuen Haushalt.
              </p>
            ) : null}
          </div>

          <div className="tw-card-soft">
            <p className="text-xs font-semibold text-slate-400">Aktiv</p>
            <p className="mt-1 text-sm font-semibold text-white">{active?.name || "—"}</p>
            <p className="mt-2 text-xs text-slate-500">
              Mitglieder werden automatisch geladen, sobald ein Haushalt aktiv ist.
            </p>
          </div>
        </div>
      </div>

      {/* Members */}
      {active ? (
        <div className="tw-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-200">
                <UsersIcon className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">Mitglieder</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {memberCount} Mitglied(er) · {adminCount} Admin(s)
                </p>
              </div>
            </div>

            <button
              type="button"
              className="tw-btn tw-btn-primary"
              onClick={() => {
                resetMessages();
                setInviteLink("");
                setCopied(false);
                setInviteOpen(true);
              }}
            >
              <UserPlusIcon className="h-5 w-5" />
              Einladen
            </button>
          </div>

          <hr className="tw-divider" />

          {members.length === 0 ? (
            <p className="text-sm text-slate-400">Keine Mitglieder geladen.</p>
          ) : (
            <ul role="list" className="divide-y divide-white/10">
              {members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{m.user?.name || "—"}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{m.user?.email || "—"}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <RoleBadge role={m.role} />
                    <span className="tw-pill tw-pill-muted">
                      Joined:{" "}
                      {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("de-DE") : "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Hinweis: Einladungen kann nur ein <span className="font-semibold">ADMIN</span> erzeugen (Backend prüft das).
          </p>
        </div>
      ) : null}

      {/* Create Household SlideOver */}
      <SlideOver
        open={createOpen}
        title="Neuen Haushalt erstellen"
        subtitle="Erstelle einen neuen Haushalt (du wirst automatisch Admin)."
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="tw-btn tw-btn-ghost"
              onClick={() => {
                setHhName("");
                setCreateOpen(false);
              }}
            >
              Abbrechen
            </button>

            <button
              type="button"
              className="tw-btn tw-btn-primary"
              disabled={!hhName.trim()}
              onClick={createHousehold}
            >
              Erstellen
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="tw-card-soft">
            <label className="tw-label">Name</label>
            <input
              className="tw-input mt-2"
              placeholder="z. B. Zuhause"
              value={hhName}
              onChange={(e) => setHhName(e.target.value)}
            />
            <p className="mt-2 text-xs text-slate-500">
              Tipp: Kurz & eindeutig (z. B. „Zuhause“, „WG“, „Ferienwohnung“).
            </p>
          </div>
        </div>
      </SlideOver>

      {/* Invite SlideOver */}
      <SlideOver
        open={inviteOpen}
        title="Mitglied einladen"
        subtitle="Erzeuge einen Einladungslink (optional an eine E-Mail gebunden)."
        onClose={() => setInviteOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="tw-btn tw-btn-ghost"
              onClick={() => {
                setInviteOpen(false);
                setInviteEmail("");
                setInviteLink("");
                setCopied(false);
              }}
            >
              Schließen
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="tw-btn"
                onClick={() => {
                  setInviteEmail("");
                  setInviteLink("");
                  setCopied(false);
                  resetMessages();
                }}
              >
                Reset
              </button>

              <button type="button" className="tw-btn tw-btn-primary" onClick={createInvite}>
                Link erzeugen
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="tw-card-soft">
            <label className="tw-label">E-Mail (optional)</label>
            <input
              className="tw-input mt-2"
              placeholder="z. B. partner@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              type="email"
            />
            <p className="mt-2 text-xs text-slate-500">
              Wenn leer, ist der Link nicht an eine E-Mail gebunden.
            </p>
          </div>

          {inviteLink ? (
            <div className="tw-card-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Einladungslink</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Gültig für 7 Tage (Server-seitig).
                  </p>
                </div>

                <button type="button" className="tw-btn" onClick={copyInvite}>
                  {copied ? <CheckIcon className="h-5 w-5" /> : <ClipboardIcon className="h-5 w-5" />}
                  {copied ? "Kopiert" : "Kopieren"}
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-200 break-all">
                {inviteLink}
              </div>
            </div>
          ) : (
            <div className="tw-card-soft">
              <p className="text-sm text-slate-300">
                Klicke auf <span className="font-semibold">„Link erzeugen“</span>, um einen Invite-Link zu erstellen.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Wenn du “Admin only” bekommst: Dein Account ist im Haushalt kein Admin.
              </p>
            </div>
          )}
        </div>
      </SlideOver>
    </div>
  );
}
