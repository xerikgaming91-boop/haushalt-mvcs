import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../prisma/client.js";
import { backupRepository } from "./backup.repository.js";

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function asDate(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickContentDispositionFilename(headerValue) {
  if (!headerValue) return null;
  // not used on server; here just for symmetry
  return null;
}

export const backupService = {
  async exportBackup(userId, householdId) {
    let ids = [];

    if (householdId) {
      const membership = await backupRepository.membership(householdId, userId);
      if (!membership) throw new AppError("Not a member of household", 403);
      ids = [householdId];
    } else {
      const rows = await backupRepository.listHouseholdIdsForUser(userId);
      ids = rows.map((r) => r.householdId);
    }

    const households = ids.length ? await backupRepository.fetchHouseholdsByIds(ids) : [];

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      households: households.map((h) => ({
        id: h.id,
        name: h.name,
        createdAt: h.createdAt,
        createdById: h.createdById,

        members: ensureArray(h.members).map((m) => ({
          id: m.id,
          householdId: m.householdId,
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt
        })),

        categories: ensureArray(h.categories).map((c) => ({
          id: c.id,
          householdId: c.householdId,
          name: c.name,
          color: c.color ?? null
        })),

        tasks: ensureArray(h.tasks).map((t) => ({
          id: t.id,
          householdId: t.householdId,
          title: t.title,
          description: t.description ?? null,
          dueAt: t.dueAt,
          allDay: !!t.allDay,
          status: t.status,

          categoryId: t.categoryId ?? null,
          assignedToId: t.assignedToId ?? null,
          createdById: t.createdById,

          recurrenceType: t.recurrenceType,
          recurrenceInterval: t.recurrenceInterval,
          recurrenceUnit: t.recurrenceUnit ?? null,
          recurrenceByWeekday: t.recurrenceByWeekday ?? null,
          recurrenceByMonthday: t.recurrenceByMonthday ?? null,
          recurrenceEndAt: t.recurrenceEndAt ?? null,

          occurrences: ensureArray(t.occurrences).map((o) => ({
            id: o.id,
            taskId: o.taskId,
            occurrenceAt: o.occurrenceAt,
            status: o.status,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt
          }))
        })),

        shoppingItems: ensureArray(h.shoppingItems).map((s) => ({
          id: s.id,
          householdId: s.householdId,
          name: s.name,
          quantity: s.quantity ?? null,
          note: s.note ?? null,
          isPurchased: !!s.isPurchased,
          purchasedAt: s.purchasedAt ?? null,
          purchasedById: s.purchasedById ?? null,
          createdById: s.createdById,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        })),

        invites: ensureArray(h.invites).map((i) => ({
          id: i.id,
          token: i.token,
          email: i.email ?? null,
          householdId: i.householdId,
          createdAt: i.createdAt,
          expiresAt: i.expiresAt,
          acceptedAt: i.acceptedAt ?? null,
          acceptedById: i.acceptedById ?? null
        }))
      }))
    };
  },

  async restoreBackup(userId, payload, mode) {
    if (mode !== "replace") throw new AppError("Invalid mode", 400);

    const incoming = ensureArray(payload.households);

    // Minimal guard: restore nur wenn im Backup mindestens ein Haushalt existiert
    // und der User darin entweder createdBy ist ODER als Member auftaucht.
    const canRestore = incoming.some((h) => {
      const members = ensureArray(h.members);
      return h.createdById === userId || members.some((m) => m && m.userId === userId);
    });
    if (!canRestore) {
      throw new AppError("Backup does not belong to your account (no matching membership)", 400);
    }

    // Sammle alle referenzierten UserIds -> existierende prüfen (FK Schutz)
    const referencedUserIds = new Set();
    for (const h of incoming) {
      if (h.createdById) referencedUserIds.add(String(h.createdById));
      for (const m of ensureArray(h.members)) if (m?.userId) referencedUserIds.add(String(m.userId));
      for (const t of ensureArray(h.tasks)) {
        if (t?.createdById) referencedUserIds.add(String(t.createdById));
        if (t?.assignedToId) referencedUserIds.add(String(t.assignedToId));
      }
      for (const s of ensureArray(h.shoppingItems)) {
        if (s?.createdById) referencedUserIds.add(String(s.createdById));
        if (s?.purchasedById) referencedUserIds.add(String(s.purchasedById));
      }
      for (const i of ensureArray(h.invites)) {
        if (i?.acceptedById) referencedUserIds.add(String(i.acceptedById));
      }
    }

    const existingUsers = new Set(
      (await backupRepository.existingUserIdsByIds([...referencedUserIds])).map((u) => u.id)
    );

    const safeUserId = (id) => (id && existingUsers.has(String(id)) ? String(id) : userId);
    const safeOptionalUserId = (id) => (id && existingUsers.has(String(id)) ? String(id) : null);

    // Replace: alle Haushalte löschen wo user member ist
    const myRows = await backupRepository.listHouseholdIdsForUser(userId);
    const myIds = myRows.map((r) => r.householdId);

    await prisma.$transaction(async (tx) => {
      if (myIds.length) {
        await tx.household.deleteMany({ where: { id: { in: myIds } } });
      }

      // Restore: pro Haushalt
      for (const h of incoming) {
        const householdId = String(h.id);
        const name = String(h.name || "Haushalt");

        await tx.household.create({
          data: {
            id: householdId,
            name,
            createdById: safeUserId(h.createdById)
          }
        });

        // Members: nur existierende User, user selbst erzwingen
        const members = ensureArray(h.members)
          .filter((m) => m?.userId && existingUsers.has(String(m.userId)))
          .map((m) => ({
            id: m.id ? String(m.id) : null,
            userId: String(m.userId),
            role: m.role || "MEMBER"
          }));

        if (!members.some((m) => m.userId === userId)) {
          members.unshift({ id: null, userId, role: "ADMIN" });
        }

        for (const m of members) {
          await tx.householdMember.create({
            data: {
              ...(m.id ? { id: String(m.id) } : {}),
              householdId,
              userId: m.userId,
              role: m.role
            }
          });
        }

        // Categories
        const categoryIds = new Set();
        for (const c of ensureArray(h.categories)) {
          const id = String(c.id);
          categoryIds.add(id);
          await tx.category.create({
            data: {
              id,
              householdId,
              name: String(c.name || "Kategorie"),
              color: c.color ?? null
            }
          });
        }

        // Tasks (erst Tasks, dann Occurrences)
        const tasks = ensureArray(h.tasks);
        for (const t of tasks) {
          const id = String(t.id);
          const dueAt = asDate(t.dueAt) || new Date();

          const categoryId = t.categoryId && categoryIds.has(String(t.categoryId))
            ? String(t.categoryId)
            : null;

          await tx.task.create({
            data: {
              id,
              householdId,
              title: String(t.title || "Task"),
              description: t.description ?? null,
              dueAt,
              allDay: !!t.allDay,
              status: t.status || "OPEN",

              categoryId,
              assignedToId: safeOptionalUserId(t.assignedToId),
              createdById: safeUserId(t.createdById),

              recurrenceType: t.recurrenceType || "NONE",
              recurrenceInterval: Number(t.recurrenceInterval || 1),
              recurrenceUnit: t.recurrenceUnit ?? null,
              recurrenceByWeekday: t.recurrenceByWeekday ?? null,
              recurrenceByMonthday: t.recurrenceByMonthday ?? null,
              recurrenceEndAt: asDate(t.recurrenceEndAt)
            }
          });

          for (const o of ensureArray(t.occurrences)) {
            const occurrenceAt = asDate(o.occurrenceAt);
            if (!occurrenceAt) continue;
            await tx.taskOccurrence.create({
              data: {
                id: o.id ? String(o.id) : undefined,
                taskId: id,
                occurrenceAt,
                status: o.status || "OPEN"
              }
            });
          }
        }

        // Shopping items
        for (const s of ensureArray(h.shoppingItems)) {
          await tx.shoppingItem.create({
            data: {
              id: String(s.id),
              householdId,
              name: String(s.name || "Item"),
              quantity: s.quantity ?? null,
              note: s.note ?? null,
              isPurchased: !!s.isPurchased,
              purchasedAt: asDate(s.purchasedAt),
              purchasedById: safeOptionalUserId(s.purchasedById),
              createdById: safeUserId(s.createdById)
            }
          });
        }

        // Invites: optional (kannst du später deaktivieren)
        for (const i of ensureArray(h.invites)) {
          if (!i?.token) continue;
          await tx.invite.create({
            data: {
              id: String(i.id),
              token: String(i.token),
              email: i.email ?? null,
              householdId,
              expiresAt: asDate(i.expiresAt) || new Date(Date.now() + 7 * 24 * 3600 * 1000),
              acceptedAt: asDate(i.acceptedAt),
              acceptedById: safeOptionalUserId(i.acceptedById)
            }
          });
        }
      }
    });

    return { ok: true, restoredHouseholds: incoming.length };
  }
};
