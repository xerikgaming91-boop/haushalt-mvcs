import React, { useMemo, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  UsersIcon,
  TagIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import { useDashboard } from "../../controllers/DashboardContext.jsx";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const NAV = [
  { to: "/", label: "Dashboard", icon: HomeIcon, end: true },
  { to: "/calendar", label: "Kalender", icon: CalendarDaysIcon },
  { to: "/tasks", label: "Aufgaben", icon: ClipboardDocumentListIcon },
  { to: "/shopping", label: "Einkauf", icon: ShoppingCartIcon },
  { to: "/household", label: "Haushalt", icon: UsersIcon },
  { to: "/categories", label: "Kategorien", icon: TagIcon },
  { to: "/settings", label: "Settings", icon: Cog6ToothIcon },
];

function NavItem({ to, label, icon: Icon, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold",
          isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
        )
      }
    >
      <Icon className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SidebarContent({ auth, onNavigate }) {
  const d = useDashboard();
  const navigate = useNavigate();

  const meLabel = useMemo(() => {
    const u = auth?.me;
    if (!u) return "—";
    return u.name || u.email || "Account";
  }, [auth?.me]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="px-4 pt-5">
        <p className="text-sm font-semibold text-white">Haushalt Manager</p>
        <p className="text-xs text-slate-400">MVCS</p>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {NAV.map((n) => (
          <NavItem key={n.to} {...n} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Haushalt-Switcher über Account */}
      <div className="px-4 pb-4 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-300">Aktiver Haushalt</p>
            <ChevronUpDownIcon className="h-4 w-4 text-slate-500" />
          </div>

          <select
            className="tw-select mt-2"
            value={d.activeHouseholdId || ""}
            onChange={(e) => d.setActiveHouseholdId(e.target.value)}
          >
            <option value="">— wählen —</option>
            {(d.households || []).map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          {!d.activeHouseholdId ? (
            <p className="mt-2 text-xs text-slate-500">
              Falls leer: erst unter „Haushalt“ einen Haushalt erstellen.
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
          <p className="text-xs font-semibold text-slate-300">Account</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{meLabel}</p>
          {auth?.me?.email ? <p className="mt-1 truncate text-xs text-slate-400">{auth.me.email}</p> : null}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="tw-btn flex-1"
              onClick={() => {
                navigate("/settings");
                onNavigate?.();
              }}
            >
              <Cog6ToothIcon className="h-5 w-5" />
              Settings
            </button>

            <button
              type="button"
              className="tw-btn tw-btn-danger flex-1"
              onClick={() => {
                auth.logout();
                navigate("/login");
                onNavigate?.();
              }}
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthedLayout({ auth }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (auth.loadingMe) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="tw-card">Lade…</div>
      </div>
    );
  }

  if (!auth.me) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur lg:hidden">
        <button type="button" className="tw-icon-btn" onClick={() => setMobileOpen(true)} aria-label="Menü öffnen">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <p className="text-sm font-semibold text-white">Haushalt Manager</p>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-full max-w-xs border-r border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <p className="text-sm font-semibold text-white">Navigation</p>
              <button type="button" className="tw-icon-btn" onClick={() => setMobileOpen(false)} aria-label="Schließen">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <SidebarContent auth={auth} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* ✅ Layout Fix: main muss flex-1/min-w-0 sein, sonst schrumpft die Content-Spalte */}
      <div className="lg:flex">
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-white/10 lg:bg-slate-950/40 lg:backdrop-blur">
          <SidebarContent auth={auth} />
        </aside>

        <main className="flex-1 min-w-0 lg:pl-72">
          <div className="container w-full py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
