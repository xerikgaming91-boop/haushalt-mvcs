// client/src/views/layouts/AuthedLayout.jsx
import React, { useMemo, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  UsersIcon,
  TagIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function NavItem({ to, icon: Icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold",
          isActive
            ? "bg-white/10 text-white"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        )
      }
    >
      <Icon className="h-6 w-6 shrink-0 text-slate-400 group-hover:text-white" />
      {label}
    </NavLink>
  );
}

export function AuthedLayout({ auth }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const meLabel = useMemo(() => {
    const m = auth?.me;
    if (!m) return "";
    return m.name || m.email || "Account";
  }, [auth?.me]);

  const initials = useMemo(() => {
    const s = (meLabel || "A").trim();
    const parts = s.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "A";
    const b = parts[1]?.[0] || parts[0]?.[1] || "";
    return (a + b).toUpperCase();
  }, [meLabel]);

  const navigation = useMemo(
    () => [
      { to: "/", label: "Übersicht", icon: HomeIcon },
      { to: "/tasks", label: "Aufgaben", icon: ClipboardDocumentListIcon },
      { to: "/calendar", label: "Kalender", icon: CalendarDaysIcon },
      { to: "/shopping", label: "Einkauf", icon: ShoppingCartIcon },
      { to: "/finances", label: "Finanzen", icon: BanknotesIcon },
      { to: "/household", label: "Haushalt", icon: UsersIcon },
      { to: "/categories", label: "Kategorien", icon: TagIcon },
      { to: "/settings", label: "Settings", icon: Cog6ToothIcon },
    ],
    []
  );

  const doLogout = async () => {
    try {
      if (auth?.logout) await auth.logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  if (auth?.loadingMe) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
            Lädt…
          </div>
        </div>
      </div>
    );
  }

  if (!auth?.me) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          sidebarOpen ? "" : "pointer-events-none"
        )}
        aria-hidden={!sidebarOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 transform bg-slate-900 ring-1 ring-white/10 transition-transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-600/90 text-white font-black">
                HM
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">Haushalt Manager</div>
                <div className="text-xs text-slate-400">Dark Shell</div>
              </div>
            </div>

            <button
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/5"
              onClick={() => setSidebarOpen(false)}
              aria-label="Sidebar schließen"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="px-3 py-4">
            <div className="space-y-1">
              {navigation.map((n) => (
                <NavItem
                  key={n.to}
                  to={n.to}
                  icon={n.icon}
                  label={n.label}
                  onNavigate={() => setSidebarOpen(false)}
                />
              ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  doLogout();
                }}
                className="group flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <ArrowLeftOnRectangleIcon className="h-6 w-6 text-slate-400 group-hover:text-white" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 px-6 pb-4 ring-1 ring-white/10">
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-600/90 text-white font-black">
              HM
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">Haushalt Manager</div>
              <div className="text-xs text-slate-400">Dark sidebar with header</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((n) => (
                    <li key={n.to}>
                      <NavItem to={n.to} icon={n.icon} label={n.label} />
                    </li>
                  ))}
                </ul>
              </li>

              {/* Footer user */}
              <li className="-mx-2 mt-auto">
                <div className="flex items-center gap-x-3 rounded-md p-2">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{meLabel}</div>
                    <div className="truncate text-xs text-slate-400">Angemeldet</div>
                  </div>
                  <button
                    onClick={doLogout}
                    className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/5"
                    aria-label="Logout"
                    title="Logout"
                  >
                    <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                  </button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/5 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Sidebar öffnen"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="flex flex-1 items-center">
            <div className="relative w-full max-w-xl">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Suchen…"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-x-2 sm:gap-x-3">
            <button
              onClick={() => navigate("/notifications")}
              className="relative inline-flex items-center justify-center rounded-xl p-2 text-slate-200 hover:bg-white/5"
              aria-label="Benachrichtigungen"
              title="Benachrichtigungen"
            >
              <BellIcon className="h-6 w-6" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-sky-400" />
            </button>

            <button
              onClick={() => navigate("/settings")}
              className="inline-flex items-center gap-x-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800/60"
              aria-label="Profil/Settings"
              title="Profil/Settings"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs font-bold">
                {initials}
              </span>
              <span className="hidden sm:inline truncate max-w-[180px]">{meLabel}</span>
            </button>
          </div>
        </header>

        {/* Constrained content */}
        <main className="py-8">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
