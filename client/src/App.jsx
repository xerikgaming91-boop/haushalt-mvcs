import React from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuthController } from "./controllers/useAuthController.js";

import { LoginPage } from "./views/pages/LoginPage.jsx";
import { RegisterPage } from "./views/pages/RegisterPage.jsx";
import { AcceptInvitePage } from "./views/pages/AcceptInvitePage.jsx";
import { ForgotPasswordPage } from "./views/pages/ForgotPasswordPage.jsx";
import { ResetPasswordPage } from "./views/pages/ResetPasswordPage.jsx";

import { AuthedLayout } from "./views/layouts/AuthedLayout.jsx";

import { DashboardPage } from "./views/pages/DashboardPage.jsx";
import { TasksPage } from "./views/pages/TasksPage.jsx";
import { CalendarPage } from "./views/pages/CalendarPage.jsx";
import { ShoppingPage } from "./views/pages/ShoppingPage.jsx";
import { FinancesPage } from "./views/pages/FinancesPage.jsx";
import { HouseholdPage } from "./views/pages/HouseholdPage.jsx";
import { CategoriesPage } from "./views/pages/CategoriesPage.jsx";
import { BackupPage } from "./views/pages/BackupPage.jsx";
import { SettingsPage } from "./views/pages/SettingsPage.jsx";

import { DashboardProvider } from "./controllers/DashboardContext.jsx";
import { ROUTES } from "./app/routes.js";

function PublicLayout({ auth }) {
  if (auth.loadingMe) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center">
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">Lädt…</div>
      </div>
    );
  }

  if (auth.me) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <Outlet />;
}

function AuthedRoot({ auth }) {
  if (auth.loadingMe) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center">
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">Lädt…</div>
      </div>
    );
  }

  if (!auth.me) return <Navigate to="/login" replace />;

  return (
    <DashboardProvider me={auth.me}>
      <AuthedLayout auth={auth} />
    </DashboardProvider>
  );
}

export default function App() {
  const auth = useAuthController();

  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout auth={auth} />}>
        <Route path="/login" element={<LoginPage auth={auth} />} />
        <Route path="/register" element={<RegisterPage auth={auth} />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />
        <Route path="/accept" element={<AcceptInvitePage auth={auth} />} />
      </Route>

      {/* Authed */}
      <Route path={ROUTES.DASHBOARD} element={<AuthedRoot auth={auth} />}>
        <Route index element={<DashboardPage />} />
        <Route path={ROUTES.TASKS.slice(1)} element={<TasksPage />} />
        <Route path={ROUTES.CALENDAR.slice(1)} element={<CalendarPage />} />
        <Route path={ROUTES.SHOPPING.slice(1)} element={<ShoppingPage />} />
        <Route path={ROUTES.FINANCES.slice(1)} element={<FinancesPage />} />
        <Route path={ROUTES.HOUSEHOLD.slice(1)} element={<HouseholdPage />} />
        <Route path={ROUTES.CATEGORIES.slice(1)} element={<CategoriesPage />} />
        <Route path={ROUTES.BACKUP.slice(1)} element={<BackupPage />} />
        <Route path={ROUTES.SETTINGS.slice(1)} element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
