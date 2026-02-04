// client/src/App.jsx
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
import { TasksPage } from "./views/pages/TasksPage.jsx";
import { CalendarPage } from "./views/pages/CalendarPage.jsx";
import { HouseholdPage } from "./views/pages/HouseholdPage.jsx";
import { CategoriesPage } from "./views/pages/CategoriesPage.jsx";
import { ShoppingPage } from "./views/pages/ShoppingPage.jsx";
import { SettingsPage } from "./views/pages/SettingsPage.jsx";
import { FinancesPage } from "./views/pages/FinancesPage.jsx";

import { DashboardProvider } from "./controllers/DashboardContext.jsx";

function PublicLayout({ auth }) {
  const navigate = useNavigate();

  if (auth.loadingMe) {
    return (
      <div className="container">
        <div className="card">Lade…</div>
      </div>
    );
  }

  if (auth.me) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>Haushalt Manager</h1>
          <small className="muted">Anmelden, registrieren, Passwort zurücksetzen</small>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => navigate("/login")}>Login</button>
          <button className="primary" onClick={() => navigate("/register")}>
            Registrieren
          </button>
        </div>
      </div>

      <hr />
      <Outlet />
    </div>
  );
}

function AuthedRoot({ auth }) {
  // ✅ WICHTIG: me MUSS rein, sonst lädt DashboardContext nach F5 nichts
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
      {/* Public routes */}
      <Route element={<PublicLayout auth={auth} />}>
        <Route path="/login" element={<LoginPage auth={auth} />} />
        <Route path="/register" element={<RegisterPage auth={auth} />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />
        <Route path="/accept" element={<AcceptInvitePage auth={auth} />} />
      </Route>

      {/* Authed routes */}
      <Route path="/" element={<AuthedRoot auth={auth} />}>
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="finances" element={<FinancesPage />} />
        <Route path="household" element={<HouseholdPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
