import { useCallback, useMemo, useState } from "react";
import { backupService } from "../services/backup.service.js";

export function useBackupController(dashboard) {
  const households = dashboard?.households || [];
  const activeHouseholdId = dashboard?.activeHouseholdId || "";

  const [selectedHouseholdId, setSelectedHouseholdId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const householdOptions = useMemo(() => {
    return [
      { id: "", name: "Alle Haushalte" },
      ...households.map((h) => ({ id: h.id, name: h.name }))
    ];
  }, [households]);

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const download = useCallback(async () => {
    clearMessages();
    setBusy(true);
    try {
      const { blob, filename } = await backupService.downloadBackup(selectedHouseholdId || undefined);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setSuccess("Backup heruntergeladen.");
    } catch (e) {
      setError(e?.message || "Download fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }, [selectedHouseholdId, clearMessages]);

  const restoreFromFile = useCallback(async (file, mode = "replace") => {
    clearMessages();
    if (!file) {
      setError("Bitte zuerst eine JSON-Datei auswählen.");
      return;
    }

    setBusy(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      const result = await backupService.restoreBackup(payload, mode);
      setSuccess(`Restore erfolgreich. Haushalte: ${result?.restoredHouseholds ?? 0}`);
    } catch (e) {
      setError(e?.message || "Restore fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }, [clearMessages]);

  return {
    households,
    activeHouseholdId,

    selectedHouseholdId,
    setSelectedHouseholdId,
    householdOptions,

    busy,
    error,
    success,

    download,
    restoreFromFile,
    clearMessages
  };
}
