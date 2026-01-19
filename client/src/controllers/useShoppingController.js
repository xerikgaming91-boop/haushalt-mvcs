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
      await shoppingService.create(dto);
      await reload();
    },
    [reload]
  );

  const togglePurchased = useCallback(
    async (item) => {
      setError("");
      await shoppingService.update(item.id, { isPurchased: !item.isPurchased });
      await reload();
    },
    [reload]
  );

  const updateItem = useCallback(
    async (id, patch) => {
      setError("");
      await shoppingService.update(id, patch);
      await reload();
    },
    [reload]
  );

  const removeItem = useCallback(
    async (id) => {
      setError("");
      await shoppingService.remove(id);
      await reload();
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
