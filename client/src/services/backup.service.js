import { apiClient } from "./apiClient.js";
import { storageService } from "./storage.service.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getFilenameFromContentDisposition(header) {
  if (!header) return null;
  const match = /filename="([^"]+)"/i.exec(header);
  return match ? match[1] : null;
}

export const backupService = {
  async downloadBackup(householdId) {
    const token = storageService.getToken();
    const qs = householdId ? `?householdId=${encodeURIComponent(householdId)}` : "";
    const res = await fetch(API_URL + "/backup/download" + qs, {
      method: "GET",
      headers: token ? { Authorization: "Bearer " + token } : {}
    });

    if (!res.ok) {
      let msg = "";
      try {
        const j = await res.json();
        msg = j?.error || "";
      } catch {
        msg = "";
      }
      throw new Error(msg || `Request failed (${res.status})`);
    }

    const blob = await res.blob();
    const filename = getFilenameFromContentDisposition(res.headers.get("content-disposition"))
      || `haushalt-backup-${new Date().toISOString().slice(0, 10)}.json`;

    return { blob, filename };
  },

  async restoreBackup(payload, mode = "replace") {
    return apiClient(`/backup/restore?mode=${encodeURIComponent(mode)}`, {
      method: "POST",
      body: payload
    });
  }
};
