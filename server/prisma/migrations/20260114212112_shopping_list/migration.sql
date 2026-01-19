-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "note" TEXT,
    "isPurchased" BOOLEAN NOT NULL DEFAULT false,
    "purchasedAt" DATETIME,
    "purchasedById" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShoppingItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShoppingItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShoppingItem_purchasedById_fkey" FOREIGN KEY ("purchasedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ShoppingItem_householdId_createdAt_idx" ON "ShoppingItem"("householdId", "createdAt");

-- CreateIndex
CREATE INDEX "ShoppingItem_householdId_isPurchased_idx" ON "ShoppingItem"("householdId", "isPurchased");
