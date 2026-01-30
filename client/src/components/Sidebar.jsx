import React from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ShoppingCartIcon,
  HomeModernIcon,
  TagIcon,
  Cog6ToothIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

function navClass({ isActive }) {
  return [
    "group flex gap-x-3 rounded-xl p-2 text-sm font-semibold leading-6",
    isActive ? "bg-slate-900/60 text-white" : "text-slate-200 hover:bg-slate-900/40 hover:text-white"
  ].join(" ");
}

function iconClass({ isActive }) {
  return [
    "h-6 w-6 shrink-0",
    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
  ].join(" ");
}

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-blue-400" fill="currentColor" aria-hidden="true">
      <path d="M3 12c4.5-6 9-6 13.5 0S21 18 21 18c-4.5 6-9 6-13.5 0S3 12 3 12z" opacity="0.9" />
      <path d="M6 12c3-4 6-4 9 0s3 0 3 0c-3 4-6 4-9 0s-3 0-3 0z" opacity="0.7" />
    </svg>
  );
}

export function Sidebar({ me, onLogout, onNavigate, showClose = false, onClose }) {
  const handleNavigate = () => {
    if (typeof onNavigate === "function") onNavigate();
  };

  return (
    <div className="flex grow flex-col">
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-200">Haushalt Manager</div>
            <div className="truncate text-xs text-slate-400">{me?.name ? `Angemeldet als: ${me.name}` : ""}</div>
          </div>
        </div>

        {showClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-950/40 p-2 hover:bg-slate-900/40"
            aria-label="Schließen"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav className="mt-6 flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              <li>
                <NavLink to="/" end className={navClass} onClick={handleNavigate}>
                  {({ isActive }) => (
                    <>
                      <HomeIcon className={iconClass({ isActive })} />
                      Übersicht
                    </>
                  )}
                </NavLink>
              </li>

              <li>
                <NavLink to="/tasks" className={navClass} onClick={handleNavigate}>
                  {({ isActive }) => (
                    <>
                      <ClipboardDocumentListIcon className={iconClass({ isActive })} />
                      Aufgaben
                    </>
                  )}
                </NavLink>
              </li>

              <li>
                <NavLink to="/calendar" className={navClass} onClick={handleNavigate}>
                  {({ isActive }) => (
                    <>
                      <CalendarIcon className={iconClass({ isActive })} />
                      Kalender
                    </>
                  )}
                </NavLink>
              </li>

              <li>
                <NavLink to="/shopping" className={navClass} onClick={handleNavigate}>
                  {({ isActive }) => (
                    <>
                      <ShoppingCartIcon className={iconClass({ isActive })} />
                      Einkaufsliste
                    </>
                  )}
                </NavLink>
              </li>

              <li>
                <NavLink to="/household" className={navClass} onClick={handleNavigate}>
                  {({ isActive }) => (
                    <>
                      <HomeModernIcon className={iconClass({ isActive })} />
                      Haushalt
                    </>
                  )}
                </NavLink>
              </li>

              <li>
                <NavLink to="/categories" className={navClass} onClick={handleNavigate}>
                  {({ isActive }) => (
                    <>
                      <TagIcon className={iconClass({ isActive })} />
                      Kategorien
                    </>
                  )}
                </NavLink>
              </li>
            </ul>
          </li>

          <li className="mt-auto">
            <NavLink to="/settings" className={navClass} onClick={handleNavigate}>
              {({ isActive }) => (
                <>
                  <Cog6ToothIcon className={iconClass({ isActive })} />
                  Settings
                </>
              )}
            </NavLink>

            <button
              type="button"
              onClick={onLogout}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/40"
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
