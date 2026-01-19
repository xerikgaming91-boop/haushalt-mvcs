import React from "react";
import { NavLink } from "react-router-dom";

function navClass({ isActive }) {
  return "navLink" + (isActive ? " active" : "");
}

export function Sidebar({ me, onLogout }) {
  return (
    <div className="sidebarInner">
      <div>
        <div className="appTitle">Haushalt Manager</div>
        <small className="muted">Angemeldet als: {me?.name}</small>
      </div>

      <hr />

      <nav className="nav">
        <NavLink to="/" end className={navClass}>
          Übersicht
        </NavLink>
        <NavLink to="/tasks" className={navClass}>
          Aufgaben
        </NavLink>
        <NavLink to="/calendar" className={navClass}>
          Kalender
        </NavLink>
        <NavLink to="/shopping" className={navClass}>
          Einkaufsliste
        </NavLink>
        <NavLink to="/household" className={navClass}>
          Haushalt
        </NavLink>
        <NavLink to="/categories" className={navClass}>
          Kategorien
        </NavLink>
      </nav>

      <div className="sidebarFooter">
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
