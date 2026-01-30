import React, { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { DashboardProvider } from "../../controllers/DashboardContext.jsx";
import { ToastProvider } from "../../components/ToastProvider.jsx";
import { NotificationsProvider } from "../../controllers/NotificationsContext.jsx";
import { NotificationEventsProvider } from "../../controllers/NotificationEventsContext.jsx";
import { NotificationDaemon } from "../../components/NotificationDaemon.jsx";

import { Sidebar } from "../../components/Sidebar.jsx";
import { Topbar } from "../../components/Topbar.jsx";

export function AuthedLayout({ auth }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const CONTENT_MAX = "max-w-6xl";

  if (auth.loadingMe) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <div className={`mx-auto w-full ${CONTENT_MAX} px-4 py-6 sm:px-6 lg:px-8`}>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">Lade…</div>
        </div>
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
    <ToastProvider>
      <NotificationsProvider>
        <NotificationEventsProvider>
          <DashboardProvider me={auth.me}>
            <NotificationDaemon me={auth.me} />

            <div className="min-h-screen bg-slate-950 text-slate-200">
              {/* Mobile sidebar */}
              {mobileOpen ? (
                <div className="lg:hidden">
                  <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)} />
                  <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] overflow-y-auto border-r border-slate-800 bg-slate-950/95 p-4">
                    <Sidebar
                      me={auth.me}
                      onLogout={onLogout}
                      onNavigate={() => setMobileOpen(false)}
                      showClose
                      onClose={() => setMobileOpen(false)}
                    />
                  </div>
                </div>
              ) : null}

              {/* Desktop sidebar */}
              <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-800 bg-slate-950/30 px-6 pb-4">
                  <Sidebar me={auth.me} onLogout={onLogout} />
                </div>
              </div>

              {/* Main */}
              <div className="lg:pl-72">
                <Topbar me={auth.me} onOpenSidebar={() => setMobileOpen(true)} maxWidthClass={CONTENT_MAX} />

                <main className="py-8">
                  <div className={`mx-auto w-full ${CONTENT_MAX} px-4 sm:px-6 lg:px-8`}>
                    <Outlet />
                  </div>
                </main>
              </div>
            </div>
          </DashboardProvider>
        </NotificationEventsProvider>
      </NotificationsProvider>
    </ToastProvider>
  );
}
