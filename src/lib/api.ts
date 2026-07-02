import { Box, BoxItem, InventoryItem, Profile, Transaction, LiveFeedItem, Battle, ChatMessage } from "../types";
import { callFunction } from "./supabase";

export async function getBoxes(): Promise<Box[]> {
  const res = await fetch("/api/boxes");
  if (!res.ok) throw new Error("Failed to fetch boxes");
  return res.json();
}

export async function getBoxDetails(boxId: string): Promise<{ box: Box; items: BoxItem[] }> {
  const res = await fetch(`/api/boxes/${boxId}`);
  if (!res.ok) throw new Error("Failed to fetch box details");
  return res.json();
}

export async function getProfile(userId: string): Promise<Profile> {
  const res = await fetch(`/api/profile/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export async function updateProfile(userId: string, data: { username: string; shipping_address: string; avatar_url?: string }): Promise<Profile> {
  const res = await fetch("/api/profile/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      id: userId, 
      username: data.username, 
      shipping_address: data.shipping_address,
      avatar_url: data.avatar_url 
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update profile");
  }
  return res.json();
}

export async function openBox(boxId: string, userId: string): Promise<{ item: BoxItem; new_balance: number; loyalty_points: number }> {
  return callFunction<{ item: BoxItem; new_balance: number; loyalty_points: number }>("open-box", { box_id: boxId, user_id: userId });
}

export async function sellItem(itemId: string, userId: string): Promise<{ success: boolean; new_balance: number; message: string }> {
  return callFunction<{ success: boolean; new_balance: number; message: string }>("sell-item", { item_id: itemId, user_id: userId });
}

export async function requestPhysicalShipping(itemId: string, userId: string, address: string): Promise<{ success: boolean; shipping_label: string; new_balance: number; message: string }> {
  const res = await fetch("/api/shipping/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id: itemId, user_id: userId, address })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Shipping request failed");
  }
  return res.json();
}

export async function submitWalletDeposit(userId: string, amount: number, method: string): Promise<{ success: boolean; new_balance: number; total_added: number; message: string }> {
  const res = await fetch("/api/wallet/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, amount, method })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Deposit failed");
  }
  return res.json();
}

export async function getInventory(userId: string): Promise<InventoryItem[]> {
  const res = await fetch(`/api/inventory/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const res = await fetch(`/api/transactions/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function getLiveFeed(): Promise<LiveFeedItem[]> {
  const res = await fetch("/api/live-feed");
  if (!res.ok) throw new Error("Failed to fetch live feed");
  return res.json();
}

export async function getLeaderboard(): Promise<any[]> {
  const res = await fetch("/api/leaderboard");
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

// Battles Arena wrappers
export async function getBattles(): Promise<Battle[]> {
  const res = await fetch("/api/battles");
  if (!res.ok) throw new Error("Failed to fetch battles list");
  return res.json();
}

export async function createBattle(hostId: string, boxId: string, maxPlayers: number): Promise<Battle> {
  const res = await fetch("/api/battles/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host_id: hostId, box_id: boxId, max_players: maxPlayers })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create battle lobby");
  }
  return res.json();
}

export async function joinBattle(battleId: string, userId: string): Promise<Battle> {
  const res = await fetch("/api/battles/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ battle_id: battleId, user_id: userId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to join battle lobby");
  }
  return res.json();
}

// Custom Mini-Games triggers
export async function buyBingoCard(userId: string): Promise<any> {
  const res = await fetch("/api/games/bingo/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Bingo purchase failed");
  }
  return res.json();
}

export async function buyLotteryTicket(userId: string, chosenNumbers: number[]): Promise<any> {
  const res = await fetch("/api/games/lottery/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, chosen_numbers: chosenNumbers })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Lottery entry failed");
  }
  return res.json();
}

export async function triggerItemUpgrade(userId: string, itemId: string): Promise<any> {
  const res = await fetch("/api/games/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, item_id: itemId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Item upgrade failed");
  }
  return res.json();
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  const res = await fetch("/api/chat");
  if (!res.ok) throw new Error("Failed to load chat messages");
  return res.json();
}

export async function sendChatMessage(username: string, text: string): Promise<ChatMessage> {
  const res = await fetch("/api/chat/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, text })
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}
