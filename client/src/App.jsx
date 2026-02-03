import React from "react";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { useAuthController } from "./controllers/useAuthController.js";

import { LoginPage } from "./views/pages/LoginPage.jsx";
import { RegisterPage } from "./views/pages/RegisterPage.jsx";
import { AcceptInvitePage } from "./views/pages/AcceptInvitePage.jsx";
import { ForgotPasswordPage } from "./views/pages/ForgotPasswordPage.jsx";
import { ResetPasswordPage } from "./views/pages/ResetPasswordPage.jsx";

import { AuthedLayout } from "./views/layouts/AuthedLayout.jsx";
import { DashboardPage } from "./views/pages/DashboardPage.jsx";
import { TasksPage } from "./views/pages/Taskspage.jsx";
import { CalendarPage } from "./views/pages/CalendarPage.jsx";
import { HouseholdPage } from "./views/pages/HouseholdPage.jsx";
import { CategoriesPage } from "./views/pages/CategoriesPage.jsx";
import { ShoppingPage } from "./views/pages/ShoppingPage.jsx";
import { SettingsPage } from "./views/pages/SettingsPage.jsx";

import { DashboardProvider } from "./controllers/DashboardContext.jsx";

function PublicLayout({ auth }) {
  const navigate = useNavigate();

  if (auth.loadingMe) {
    return (
      <div className="container py-10">
        <div className="tw-card">Lade…</div>
      </div>
    );
  }

  if (auth.me) return <Navigate to="/" replace />;

  return (
    <div className="container py-10">
      <div className="tw-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">Haushalt Manager</h1>
            <p className="mt-1 text-sm text-slate-400">Anmelden, registrieren, Passwort zurücksetzen</p>
          </div>

          <div className="flex gap-2">
            <button type="button" className="tw-btn" onClick={() => navigate("/login")}>Login</button>
            <button type="button" className="tw-btn tw-btn-primary" onClick={() => navigate("/register")}>Registrieren</button>
          </div>
        </div>

        <hr className="tw-divider" />
        <Outlet />
      </div>
    </div>
  );
}

function AuthedRoot({ auth }) {
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
      <Route element={<PublicLayout auth={auth} />}>
        <Route path="/login" element={<LoginPage auth={auth} />} />
        <Route path="/register" element={<RegisterPage auth={auth} />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />
        <Route path="/accept" element={<AcceptInvitePage auth={auth} />} />
      </Route>

      <Route path="/" element={<AuthedRoot auth={auth} />}>
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="household" element={<HouseholdPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="settings" element={<SettingsPage auth={auth} />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
