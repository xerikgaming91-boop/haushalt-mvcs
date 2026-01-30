import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../../controllers/DashboardContext.jsx";
import { useToast } from "../../components/ToastProvider.jsx";

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/55 p-6 shadow-lg shadow-black/20">
      {children}
    </div>
  );
}

export function CategoriesPage() {
  const d = useDashboard();
  const { toast } = useToast();

  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#3b82f6");
  const [localErr, setLocalErr] = useState("");

  if (!d.activeHousehold) {
    return (
      <Card>
        <h2 className="text-lg font-semibold">Kategorien</h2>
        <p className="mt-2 text-sm text-slate-400">
          Bitte zuerst einen Haushalt auswählen/erstellen unter{" "}
          <Link className="text-blue-300 hover:text-blue-200" to="/household">
            Haushalt
          </Link>
          .
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {(d.error || localErr) && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {localErr || d.error}
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Kategorien</h2>
            <p className="mt-1 text-sm text-slate-400">
              Aktiver Haushalt:{" "}
              <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/40 px-2 py-0.5 text-xs text-slate-200">
                {d.activeHousehold.name}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
          <div className="text-sm font-semibold">Neue Kategorie</div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label className="text-xs font-medium text-slate-300">Name</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Kategorie"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs font-medium text-slate-300">Farbe</label>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-2"
                type="color"
                value={categoryColor}
                onChange={(e) => setCategoryColor(e.target.value)}
              />
            </div>

            <div className="sm:col-span-1 sm:self-end">
              <button
                className="w-full rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                disabled={!categoryName.trim()}
                onClick={async () => {
                  try {
                    setLocalErr("");
                    await d.createCategory({ name: categoryName.trim(), color: categoryColor });
                    setCategoryName("");
                    toast({ title: "Hinzugefügt", description: "Kategorie wurde erstellt.", variant: "success" });
                  } catch (e) {
                    setLocalErr(e.message);
                  }
                }}
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-sm font-semibold">Liste</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(d.categories || []).map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center rounded-full border px-3 py-1 text-sm"
                style={{
                  borderColor: c.color || "#334155",
                  backgroundColor: "rgba(2,6,23,0.2)"
                }}
              >
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: c.color || "#334155" }}
                />
                {c.name}
              </span>
            ))}
            {(!d.categories || d.categories.length === 0) && <div className="text-sm text-slate-400">Noch keine Kategorien.</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}
