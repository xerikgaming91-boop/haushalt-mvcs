import { useCallback, useEffect, useMemo, useState } from "react";
import { shoppingService } from "../services/shopping.service.js";

export function useShoppingController(activeHouseholdId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [includePurchased, setIncludePurchased] = useState(true);

  const reload = useCallback(async () => {
    if (!activeHouseholdId) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const r = await shoppingService.list({
        householdId: activeHouseholdId,
        includePurchased
      });
      setItems(r.items || []);
    } catch (e) {
      setError(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeHouseholdId, includePurchased]);

  useEffect(() => {
    reload();
  }, [reload]);

  const openItems = useMemo(() => items.filter((i) => !i.isPurchased), [items]);
  const purchasedItems = useMemo(() => items.filter((i) => i.isPurchased), [items]);

  const createItem = useCallback(
    async (dto) => {
      setError("");
      try {
        await shoppingService.create(dto);
        await reload();
        return { ok: true };
      } catch (e) {
        setError(e.message);
        return { ok: false, error: e.message };
      }
    },
    [reload]
  );

  const togglePurchased = useCallback(
    async (item) => {
      setError("");
      try {
        await shoppingService.update(item.id, { isPurchased: !item.isPurchased });
        await reload();
        return { ok: true };
      } catch (e) {
        setError(e.message);
        return { ok: false, error: e.message };
      }
    },
    [reload]
  );

  const updateItem = useCallback(
    async (id, patch) => {
      setError("");
      try {
        await shoppingService.update(id, patch);
        await reload();
        return { ok: true };
      } catch (e) {
        setError(e.message);
        return { ok: false, error: e.message };
      }
    },
    [reload]
  );

  const removeItem = useCallback(
    async (id) => {
      setError("");
      try {
        await shoppingService.remove(id);
        await reload();
        return { ok: true };
      } catch (e) {
        setError(e.message);
        return { ok: false, error: e.message };
      }
    },
    [reload]
  );

  return {
    loading,
    error,
    items,
    includePurchased,
    setIncludePurchased,
    openItems,
    purchasedItems,
    reload,
    createItem,
    togglePurchased,
    updateItem,
    removeItem
  };
}
