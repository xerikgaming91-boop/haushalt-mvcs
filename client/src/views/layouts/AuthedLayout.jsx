import React from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { DashboardProvider } from "../../controllers/DashboardContext.jsx";
import { Sidebar } from "../../components/Sidebar.jsx";

export function AuthedLayout({ auth }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (auth.loadingMe) {
    return (
      <div className="container">
        <div className="card">Lade…</div>
      </div>
    );
  }

  if (!auth.me) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  function onLogout() {
    auth.logout();
    navigate("/login");
  }

  return (
    <DashboardProvider me={auth.me}>
      <div className="container">
        <div className="appShell">
          <aside className="sidebar">
            <Sidebar me={auth.me} onLogout={onLogout} />
          </aside>

          <main className="main">
            <Outlet />
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
