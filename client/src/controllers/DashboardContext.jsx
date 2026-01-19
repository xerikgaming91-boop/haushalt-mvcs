import React, { createContext, useContext } from "react";
import { useDashboardController } from "./useDashboardController.js";

const DashboardContext = createContext(null);

export function DashboardProvider({ me, children }) {
  const dashboard = useDashboardController(me);
  return <DashboardContext.Provider value={dashboard}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within <DashboardProvider />");
  }
  return ctx;
}
