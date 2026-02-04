import {
  downloadBackupQuerySchema,
  restoreBackupBodySchema,
  restoreBackupQuerySchema
} from "./backup.schemas.js";
import { backupService } from "./backup.service.js";
import { AppError } from "../../common/errors/AppError.js";

export const backupController = {
  async download(req, res) {
    const parsed = downloadBackupQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new AppError("Invalid query", 400);

    const { householdId } = parsed.data;
    const payload = await backupService.exportBackup(req.user.id, householdId);

    const fileName = `haushalt-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(JSON.stringify(payload, null, 2));
  },

  async restore(req, res) {
    const q = restoreBackupQuerySchema.safeParse(req.query);
    if (!q.success) throw new AppError("Invalid query", 400);

    const b = restoreBackupBodySchema.safeParse(req.body);
    if (!b.success) throw new AppError("Invalid backup payload", 400);

    const result = await backupService.restoreBackup(req.user.id, b.data, q.data.mode);
    return res.json(result);
  }
};
