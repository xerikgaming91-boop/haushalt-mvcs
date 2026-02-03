import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  UsersIcon,
  TagIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useDashboard } from "../../controllers/DashboardContext.jsx";

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-sm hover:bg-white/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-200">
          <Icon className="h-6 w-6" />
        </div>
        <ChevronRightIcon className="h-5 w-5 text-slate-500 opacity-0 transition group-hover:opacity-100" />
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      </div>
    </Link>
  );
}

export function DashboardPage() {
  const d = useDashboard();

  const stats = useMemo(() => {
    const tasks = d.tasks || [];
    const open = tasks.filter((t) => t.status === "OPEN").length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    return { open, done, total: tasks.length };
  }, [d.tasks]);

  if (!d.activeHousehold) {
    return (
      <div className="tw-card">
        <h2 className="text-lg font-semibold text-white">Dashboard</h2>
        <p className="mt-2 text-sm text-slate-400">
          Bitte zuerst einen Haushalt auswählen/erstellen unter{" "}
          <Link className="text-sky-300 hover:text-sky-200" to="/household">
            Haushalt
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="tw-card">
        <h2 className="text-lg font-semibold text-white">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-400">
          Aktiver Haushalt: <span className="tw-pill tw-pill-muted">{d.activeHousehold.name}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Kalender-Kachel: Icon statt Pfeil */}
        <Link
          to="/calendar"
          className="group rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-sm hover:bg-white/5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-200">
              <CalendarDaysIcon className="h-6 w-6" />
            </div>
            <CalendarDaysIcon className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-400">Kalender</p>
            <p className="mt-1 text-sm text-slate-200">Übersicht aller Termine</p>
          </div>
        </Link>

        <StatCard icon={ClipboardDocumentListIcon} label="Offene Aufgaben" value={stats.open} to="/tasks" />
        <StatCard icon={ShoppingCartIcon} label="Einkauf" value="→" to="/shopping" />
        <StatCard icon={UsersIcon} label="Mitglieder" value={(d.members || []).length} to="/household" />
        <StatCard icon={TagIcon} label="Kategorien" value={(d.categories || []).length} to="/categories" />
      </div>

      <div className="tw-card">
        <h3 className="text-sm font-semibold text-white">Kurzinfo</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="tw-card-soft">
            <p className="text-xs font-semibold text-slate-400">Aufgaben total</p>
            <p className="mt-1 text-xl font-semibold text-white">{stats.total}</p>
          </div>
          <div className="tw-card-soft">
            <p className="text-xs font-semibold text-slate-400">Erledigt</p>
            <p className="mt-1 text-xl font-semibold text-white">{stats.done}</p>
          </div>
          <div className="tw-card-soft">
            <p className="text-xs font-semibold text-slate-400">Offen</p>
            <p className="mt-1 text-xl font-semibold text-white">{stats.open}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
