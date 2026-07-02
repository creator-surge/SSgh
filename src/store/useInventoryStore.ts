import { create } from "zustand";
import { InventoryItem } from "../types";
import { getInventory, sellItem, requestPhysicalShipping, triggerItemUpgrade } from "../lib/api";

interface InventoryState {
  items: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchInventory: (userId: string) => Promise<void>;
  resell: (itemId: string, userId: string) => Promise<void>;
  shipItem: (itemId: string, userId: string, address: string) => Promise<string>;
  upgradeItemOnLine: (userId: string, itemId: string) => Promise<{ success: boolean; upgraded: boolean; message: string }>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchInventory: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const items = await getInventory(userId);
      set({ items, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  resell: async (itemId: string, userId: string) => {
    try {
      await sellItem(itemId, userId);
      const items = await getInventory(userId);
      set({ items });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  shipItem: async (itemId: string, userId: string, address: string) => {
    try {
      const res = await requestPhysicalShipping(itemId, userId, address);
      const items = await getInventory(userId);
      set({ items });
      return res.shipping_label;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  upgradeItemOnLine: async (userId: string, itemId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await triggerItemUpgrade(userId, itemId);
      const items = await getInventory(userId);
      set({ items, isLoading: false });
      return result;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  }
}));
