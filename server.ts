import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import { Box, BoxItem, InventoryItem, Profile, Transaction, LiveFeedItem, Battle, BattleParticipant, ChatMessage, BingoState, LotteryState } from "./src/types.js";

const __filenameVal = typeof import.meta !== "undefined" && import.meta.url
  ? fileURLToPath(import.meta.url)
  : (typeof __filename !== "undefined" ? __filename : "");
const __dirnameVal = __filenameVal
  ? path.dirname(__filenameVal)
  : (typeof __dirname !== "undefined" ? __dirname : process.cwd());

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- DATABASE & STATE INITIALIZATION (IN-MEMORY PERSISTENCE MOCK) ---
  const seedBoxes: Box[] = [
    {
      id: "b1111111-1111-1111-1111-111111111111",
      name: "Tech Legends",
      description: "Unbox legendary tech gear, custom keyboards, and top-tier gadgets.",
      image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop",
      price: 120.00,
      category: "Technology",
      rarity: "epic",
      total_opened: 145
    },
    {
      id: "b2222222-2222-2222-2222-222222222222",
      name: "Sneaker Vault",
      description: "Limited edition hypebeast footwear and legendary drops.",
      image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400&auto=format&fit=crop",
      price: 250.00,
      category: "Lifestyle",
      rarity: "legendary",
      total_opened: 84
    },
    {
      id: "b3333333-3333-3333-3333-333333333333",
      name: "Gaming Crate",
      description: "Essential equipment for pro gamers, audio gears, and accessories.",
      image_url: "https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?q=80&w=400&auto=format&fit=crop",
      price: 45.00,
      category: "Gaming",
      rarity: "rare",
      total_opened: 312
    }
  ];

  // Add 10 quick seed boxes for diversity
  for (let i = 1; i <= 10; i++) {
    seedBoxes.push({
      id: `seed-box-uuid-${i}`,
      name: `Symmetric Seed Box ${i}`,
      description: `Scalable seed box #${i} with custom calibrated drops.`,
      image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop",
      price: 15.00 + (i * 12),
      category: "Symmetric Seed",
      rarity: i % 3 === 0 ? "epic" : i % 2 === 0 ? "rare" : "common",
      total_opened: i * 8
    });
  }

  const seedItems: Record<string, BoxItem[]> = {
    "b1111111-1111-1111-1111-111111111111": [
      { id: "item-t1", box_id: "b1111111-1111-1111-1111-111111111111", name: "Custom Neon Desk Mat", image_url: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=120&auto=format&fit=crop", value: 15.00, rarity: "common", probability: 0.4000 },
      { id: "item-t2", box_id: "b1111111-1111-1111-1111-111111111111", name: "Retro Dye-Sub Keycaps", image_url: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=120&auto=format&fit=crop", value: 30.00, rarity: "common", probability: 0.3000 },
      { id: "item-t3", box_id: "b1111111-1111-1111-1111-111111111111", name: "Wireless Cyber Mouse", image_url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=120&auto=format&fit=crop", value: 80.00, rarity: "rare", probability: 0.1200 },
      { id: "item-t4", box_id: "b1111111-1111-1111-1111-111111111111", name: "Premium Gas-Spring Arm", image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=120&auto=format&fit=crop", value: 110.00, rarity: "rare", probability: 0.0800 },
      { id: "item-t5", box_id: "b1111111-1111-1111-1111-111111111111", name: "Dynamic Podcast Mic", image_url: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=120&auto=format&fit=crop", value: 250.00, rarity: "epic", probability: 0.0500 },
      { id: "item-t6", box_id: "b1111111-1111-1111-1111-111111111111", name: "Hot-Swap 75% Keyboard", image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=120&auto=format&fit=crop", value: 350.00, rarity: "epic", probability: 0.0300 },
      { id: "item-t7", box_id: "b1111111-1111-1111-1111-111111111111", name: "GeForce RTX 4080 Super", image_url: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=120&auto=format&fit=crop", value: 1200.00, rarity: "legendary", probability: 0.0200 },
    ],
    "b2222222-2222-2222-2222-222222222222": [
      { id: "item-s1", box_id: "b2222222-2222-2222-2222-222222222222", name: "Crease Shields Multipack", image_url: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=120&auto=format&fit=crop", value: 10.00, rarity: "common", probability: 0.4500 },
      { id: "item-s2", box_id: "b2222222-2222-2222-2222-222222222222", name: "Acrylic Display Cases", image_url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=120&auto=format&fit=crop", value: 35.00, rarity: "common", probability: 0.2500 },
      { id: "item-s3", box_id: "b2222222-2222-2222-2222-222222222222", name: "Suede Cleaning Care Kit", image_url: "https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=120&auto=format&fit=crop", value: 40.00, rarity: "rare", probability: 0.1200 },
      { id: "item-s4", box_id: "b2222222-2222-2222-2222-222222222222", name: "Platform Cyber Slides", image_url: "https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=120&auto=format&fit=crop", value: 95.00, rarity: "rare", probability: 0.0800 },
      { id: "item-s5", box_id: "b2222222-2222-2222-2222-222222222222", name: "Retro Patchwork Hoodie", image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=120&auto=format&fit=crop", value: 280.00, rarity: "epic", probability: 0.0500 },
      { id: "item-s6", box_id: "b2222222-2222-2222-2222-222222222222", name: "Air Max Limited Retro", image_url: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=120&auto=format&fit=crop", value: 390.00, rarity: "epic", probability: 0.0300 },
      { id: "item-s7", box_id: "b2222222-2222-2222-2222-222222222222", name: "Custom Hypebeast Dunks", image_url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=120&auto=format&fit=crop", value: 1500.00, rarity: "legendary", probability: 0.0200 },
    ],
    "b3333333-3333-3333-3333-333333333333": [
      { id: "item-g1", box_id: "b3333333-3333-3333-3333-333333333333", name: "Silicone Anti-Slip Grips", image_url: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=120&auto=format&fit=crop", value: 8.00, rarity: "common", probability: 0.4000 },
      { id: "item-g2", box_id: "b3333333-3333-3333-3333-333333333333", name: "Neon RGB Glow Strip", image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=120&auto=format&fit=crop", value: 15.00, rarity: "common", probability: 0.3000 },
      { id: "item-g3", box_id: "b3333333-3333-3333-3333-333333333333", name: "High-Tension Mouse Bungee", image_url: "https://images.unsplash.com/photo-1605773527852-c54373bd779b?q=80&w=120&auto=format&fit=crop", value: 22.00, rarity: "rare", probability: 0.1200 },
      { id: "item-g4", box_id: "b3333333-3333-3333-3333-333333333333", name: "Hexagon Acoustic Tiles x10", image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=120&auto=format&fit=crop", value: 40.00, rarity: "rare", probability: 0.0800 },
      { id: "item-g5", box_id: "b3333333-3333-3333-3333-333333333333", name: "Immersive RGB Headset", image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=120&auto=format&fit=crop", value: 110.00, rarity: "epic", probability: 0.0500 },
      { id: "item-g6", box_id: "b3333333-3333-3333-3333-333333333333", name: "Premium USB Macro Pad", image_url: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=120&auto=format&fit=crop", value: 130.00, rarity: "epic", probability: 0.0300 },
      { id: "item-g7", box_id: "b3333333-3333-3333-3333-333333333333", name: "Tactile Command Center", image_url: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=120&auto=format&fit=crop", value: 380.00, rarity: "legendary", probability: 0.0200 },
    ]
  };

  // Populate dynamic items for seed boxes
  for (let i = 1; i <= 10; i++) {
    const bId = `seed-box-uuid-${i}`;
    seedItems[bId] = [
      { id: `seed-i-${i}-1`, box_id: bId, name: `Seed Metal Crest ${i}`, image_url: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=120&auto=format&fit=crop", value: 1.50 + (i % 5), rarity: "common", probability: 0.70 },
      { id: `seed-i-${i}-2`, box_id: bId, name: `Seed Plasma Connector ${i}`, image_url: "https://images.unsplash.com/photo-1605773527852-c54373bd779b?q=80&w=120&auto=format&fit=crop", value: 10.00 + (i % 10), rarity: "rare", probability: 0.20 },
      { id: `seed-i-${i}-3`, box_id: bId, name: `Seed Fusion Core ${i}`, image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=120&auto=format&fit=crop", value: 45.00 + (i % 25), rarity: "epic", probability: 0.08 },
      { id: `seed-i-${i}-4`, box_id: bId, name: `Seed Quantum Processor ${i}`, image_url: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=120&auto=format&fit=crop", value: 220.00 + (i % 100), rarity: "legendary", probability: 0.02 },
    ];
  }

  // --- LOCAL MUTABLE DATASTORE ---
  let profiles: Profile[] = [
    {
      id: "user-default-id",
      email: "epticwolf27@gmail.com",
      username: "AlphaSurger",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=AlphaSurger",
      balance: 100.00, // Welcoming joins
      loyalty_points: 25,
      tier: "Silver",
      shipping_address: "123 Neon Parkway, Retro City, RC 3030",
      created_at: new Date().toISOString()
    },
    {
      id: "user-admin-id",
      email: "admin@surgebox.io",
      username: "admin",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=admin",
      balance: 50000.00,
      loyalty_points: 9999,
      tier: "Legendary Creator",
      shipping_address: "HQ Cyber Tower, Port 3000",
      created_at: new Date().toISOString()
    }
  ];

  let inventories: InventoryItem[] = [];
  let transactions: Transaction[] = [];
  let liveFeed: LiveFeedItem[] = [
    {
      id: "feed-1",
      username: "HypeCoder",
      box_name: "Tech Legends",
      item_name: "Retro Dye-Sub Keycaps",
      item_rarity: "common",
      item_value: 30.00,
      created_at: new Date(Date.now() - 5000).toISOString()
    },
    {
      id: "feed-2",
      username: "SlickSlick",
      box_name: "Sneaker Vault",
      item_name: "Air Max Limited Retro",
      item_rarity: "epic",
      item_value: 390.00,
      created_at: new Date(Date.now() - 15000).toISOString()
    }
  ];

  let chatMessages: ChatMessage[] = [
    { id: "chat-1", username: "System", text: "Welcome to SurgeBox Ultra Chat. Good luck on your unboxings!", timestamp: new Date().toISOString(), system: true },
    { id: "chat-2", username: "HypeCoder", text: "Just pulled some sweet Retro Keycaps! Let's go!", timestamp: new Date(Date.now() - 4000).toISOString() }
  ];

  let battles: Battle[] = [];
  let bingoCards: BingoState[] = [];
  let lotteryTickets: LotteryState[] = [];

  // Helper function to pick items weighted
  function rollItem(items: BoxItem[]): BoxItem {
    const totalProbability = items.reduce((sum, item) => sum + item.probability, 0);
    let r = Math.random() * totalProbability;
    for (const item of items) {
      if (r < item.probability) return item;
      r -= item.probability;
    }
    return items[items.length - 1];
  }

  // --- API ROUTE HANDLERS ---

  // Auth/Profiles
  app.get("/api/profile/:id", (req, res) => {
    let profile = profiles.find(p => p.id === req.params.id);
    if (!profile) {
      // Auto-create on demand
      profile = {
        id: req.params.id,
        email: "guest@surgebox.io",
        username: "GuestUnboxer_" + Math.floor(1000 + Math.random() * 9000),
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${req.params.id}`,
        balance: 100.00, // $100 Join Welcome Bonus
        loyalty_points: 10,
        tier: "Bronze",
        created_at: new Date().toISOString()
      };
      profiles.push(profile);
    }
    res.json(profile);
  });

  app.post("/api/profile/update", (req, res) => {
    const { id, username, shipping_address } = req.body;
    const profile = profiles.find(p => p.id === id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    if (username) {
      // Ensure unique
      const existing = profiles.find(p => p.username === username && p.id !== id);
      if (existing) return res.status(400).json({ error: "Username already taken" });
      profile.username = username;
    }
    if (shipping_address !== undefined) {
      profile.shipping_address = shipping_address;
    }
    res.json(profile);
  });

  // Daily Rewards endpoint - simulated Supabase transaction
  app.post("/api/profile/claim-daily", (req, res) => {
    const { user_id } = req.body;
    
    // Simulating database transactional BEGIN/FOR UPDATE lock
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (profile.last_claim_date === todayStr) {
      return res.status(400).json({ error: "Daily reward already claimed today. Come back tomorrow!" });
    }

    let currentStreak = profile.daily_streak || 0;
    let isConsecutive = false;

    if (profile.last_claim_date) {
      const lastClaim = new Date(profile.last_claim_date);
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (profile.last_claim_date === yesterdayStr) {
        isConsecutive = true;
      }
    }

    if (isConsecutive) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    // Base reward is 5.00 credits, plus streak bonus ($0.50 per day up to $5.00 maximum bonus)
    const baseReward = 5.00;
    const streakBonus = Math.min(5.00, (currentStreak - 1) * 0.50);
    const totalReward = Number((baseReward + streakBonus).toFixed(2));

    // Transaction-safe updates
    profile.balance = Number((profile.balance + totalReward).toFixed(2));
    profile.daily_streak = currentStreak;
    profile.last_claim_date = todayStr;
    profile.last_claimed_at = now.toISOString();

    // Record Transaction Ledger Entry
    const newTx: Transaction = {
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: profile.id,
      type: "deposit",
      amount: totalReward,
      description: `Daily Reward Claimed (Day ${currentStreak} Streak)`,
      created_at: now.toISOString()
    };
    transactions.push(newTx);

    res.json({
      success: true,
      reward_amount: totalReward,
      new_balance: profile.balance,
      streak: currentStreak,
      last_claim_date: todayStr,
      profile
    });
  });

  // Fetch Boxes & Items
  app.get("/api/boxes", (req, res) => {
    res.json(seedBoxes);
  });

  app.get("/api/boxes/:id", (req, res) => {
    const box = seedBoxes.find(b => b.id === req.params.id);
    if (!box) return res.status(404).json({ error: "Box not found" });
    const items = seedItems[box.id] || [];
    res.json({ box, items });
  });

  // Open Box (Edge simulated endpoint)
  // Security Constraint Check: Performed strictly on server to deduct funds and issue item
  app.post("/api/open-box", (req, res) => {
    const { box_id, user_id } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "User profile not found" });

    const box = seedBoxes.find(b => b.id === box_id);
    if (!box) return res.status(404).json({ error: "Box not found" });

    // Validate sufficient balance server-side
    if (profile.balance < box.price) {
      return res.status(400).json({ error: "Insufficient balance for unboxing" });
    }

    const items = seedItems[box.id];
    if (!items || items.length === 0) {
      return res.status(500).json({ error: "No items configured for this box" });
    }

    // Server-Authoritative deduction
    profile.balance = Number((profile.balance - box.price).toFixed(2));
    box.total_opened += 1;

    // Pick dynamic reward based on weighted mathematical random distribution
    const prize = rollItem(items);

    // Write to Inventory
    const newInvItem: InventoryItem = {
      id: "inv-" + Math.floor(100000 + Math.random() * 900000),
      user_id: profile.id,
      item_id: prize.id,
      box_name: box.name,
      status: "inventory",
      sell_price: Number((prize.value * 0.8).toFixed(2)), // 80% resell recovery rate
      created_at: new Date().toISOString(),
      item: prize
    };
    inventories.push(newInvItem);

    // Record Transaction Ledger Entry
    const newTx: Transaction = {
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: profile.id,
      type: "unbox",
      amount: -box.price,
      description: `Unboxed "${prize.name}" from ${box.name}`,
      created_at: new Date().toISOString()
    };
    transactions.push(newTx);

    // Add Loyalty points
    profile.loyalty_points += Math.max(1, Math.floor(box.price / 10));

    // Update Live global feed & Chat Alert
    const feedItem: LiveFeedItem = {
      id: "feed-" + Math.floor(100000 + Math.random() * 900000),
      username: profile.username,
      box_name: box.name,
      item_name: prize.name,
      item_rarity: prize.rarity,
      item_value: prize.value,
      created_at: new Date().toISOString()
    };
    liveFeed.unshift(feedItem);
    if (liveFeed.length > 50) liveFeed.pop();

    chatMessages.push({
      id: "chat-" + Math.floor(100000 + Math.random() * 900000),
      username: "System Drop Alert",
      text: `${profile.username} just pulled "${prize.name}" (${prize.rarity.toUpperCase()}) worth $${prize.value}!`,
      timestamp: new Date().toISOString(),
      item_drop: {
        item_name: prize.name,
        rarity: prize.rarity,
        value: prize.value
      }
    });
    if (chatMessages.length > 100) chatMessages.shift();

    res.json({
      item: prize,
      new_balance: profile.balance,
      loyalty_points: profile.loyalty_points
    });
  });

  // Sell Inventory Item
  // Security Constraint: Check ownership before balance crediting
  app.post("/api/sell-item", (req, res) => {
    const { item_id, user_id } = req.body;
    const itemIndex = inventories.findIndex(inv => inv.id === item_id && inv.user_id === user_id && inv.status === 'inventory');
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in inventory or already sold" });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const invItem = inventories[itemIndex];
    invItem.status = 'sold';

    // Credit profile balance
    profile.balance = Number((profile.balance + invItem.sell_price).toFixed(2));

    // Transaction entry
    const sellTx: Transaction = {
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: user_id,
      type: "sell",
      amount: invItem.sell_price,
      description: `Resold unboxed item "${invItem.item?.name}" for 80% market value`,
      created_at: new Date().toISOString()
    };
    transactions.push(sellTx);

    res.json({
      success: true,
      new_balance: profile.balance,
      message: `Sold ${invItem.item?.name} for $${invItem.sell_price}`
    });
  });

  // Physical shipping labels creation
  app.post("/api/shipping/request", (req, res) => {
    const { item_id, user_id, address } = req.body;
    const item = inventories.find(inv => inv.id === item_id && inv.user_id === user_id && inv.status === 'inventory');
    if (!item) return res.status(404).json({ error: "Item not available for shipping" });

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "User not found" });

    // Deduct standard flat shipping insurance credit ($10.00) or let it be free
    const fee = 10.00;
    if (profile.balance < fee) {
      return res.status(400).json({ error: "Insufficient funds for shipping insurance fee ($10.00)" });
    }

    profile.balance = Number((profile.balance - fee).toFixed(2));
    item.status = 'shipped';
    
    // Generate physical address shipping label
    const randomLabel = `SHIP-USPS-${Math.floor(100000 + Math.random()*900000)}-SB`;
    item.shipping_label = randomLabel;

    transactions.push({
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: user_id,
      type: "shipping_fee",
      amount: -fee,
      description: `Requested physical home delivery shipping label: ${randomLabel}`,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      shipping_label: randomLabel,
      new_balance: profile.balance,
      message: `Successfully requested physical shipping for ${item.item?.name}!`
    });
  });

  // Top Up Wallet (Simulating Stripe & Deposit Channels)
  app.post("/api/wallet/deposit", (req, res) => {
    const { user_id, amount, method } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid deposit amount" });
    }

    // 5% additional crypto bonus calculation
    const isCrypto = method === 'Crypto';
    const bonus = isCrypto ? Number((parsedAmount * 0.05).toFixed(2)) : 0;
    const totalAdded = parsedAmount + bonus;

    profile.balance = Number((profile.balance + totalAdded).toFixed(2));

    const depositTx: Transaction = {
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: user_id,
      type: "deposit",
      amount: parsedAmount,
      description: `Deposited funds via ${method}${isCrypto ? " (Includes +5% Crypto Deposit Bonus)" : ""}`,
      created_at: new Date().toISOString()
    };
    transactions.push(depositTx);

    if (bonus > 0) {
      transactions.push({
        id: "tx-b-" + Math.floor(100000 + Math.random() * 900000),
        user_id: user_id,
        type: "deposit",
        amount: bonus,
        description: `Promo Bonus: +5% Crypto top-up credit boost`,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      new_balance: profile.balance,
      total_added: totalAdded,
      message: `Deposited ${totalAdded} securely!`
    });
  });

  // Create pending Crypto transaction
  app.post("/api/wallet/crypto-deposit", (req, res) => {
    const { user_id, amount, coin } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid deposit amount" });
    }

    const pendingTx: Transaction = {
      id: "tx-crypto-" + Math.floor(100000 + Math.random() * 900000),
      user_id: user_id,
      type: "deposit",
      amount: parsedAmount,
      description: `Pending Crypto Deposit (${coin})`,
      created_at: new Date().toISOString(),
      status: 'pending'
    };
    transactions.push(pendingTx);

    res.json({
      success: true,
      transaction: pendingTx,
      message: `Pending ${coin} deposit of ${parsedAmount} initiated.`
    });
  });

  // Confirm pending Crypto transaction (simulating Edge Function verification)
  app.post("/api/wallet/crypto-confirm", (req, res) => {
    const { transaction_id, user_id } = req.body;
    const txIndex = transactions.findIndex(t => t.id === transaction_id);
    if (txIndex === -1) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const tx = transactions[txIndex];
    if (tx.status !== 'pending') {
      return res.status(400).json({ error: "Transaction is not pending or already completed" });
    }

    const profile = profiles.find(p => p.id === (user_id || tx.user_id));
    if (!profile) return res.status(404).json({ error: "Profile not found for this transaction" });

    const parsedAmount = Number(tx.amount);
    const bonus = Number((parsedAmount * 0.05).toFixed(2));
    const totalAdded = parsedAmount + bonus;

    // Credit user's wallet
    profile.balance = Number((profile.balance + totalAdded).toFixed(2));

    // Update main transaction status to completed
    tx.status = 'completed';
    tx.description = `${tx.description.replace('Pending ', '')} (Verified & Credited)`;

    // Payout the promo bonus transaction
    if (bonus > 0) {
      transactions.push({
        id: "tx-b-" + Math.floor(100000 + Math.random() * 900000),
        user_id: profile.id,
        type: "deposit",
        amount: bonus,
        description: `Promo Bonus: +5% Crypto top-up credit boost`,
        created_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      new_balance: profile.balance,
      total_added: totalAdded,
      transaction: tx,
      message: `Verified and credited ${totalAdded} securely (includes 5% bonus)!`
    });
  });

  // Stripe Billing Integration Helper
  let stripeInstance: Stripe | null = null;
  function getStripeInstance() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.trim() === "" || key.trim().startsWith("pk_")) {
      return null;
    }
    if (!stripeInstance) {
      stripeInstance = new Stripe(key.trim(), {
        apiVersion: "2022-11-15" as any
      });
    }
    return stripeInstance;
  }

  // Create Stripe Checkout Session
  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    const { user_id, amount, credited_amount } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 5) {
      return res.status(400).json({ error: "Minimum deposit is $5.00" });
    }

    const parsedCreditedAmount = credited_amount ? Number(credited_amount) : parsedAmount;

    const key = process.env.STRIPE_SECRET_KEY;
    if (key && key.trim().startsWith("pk_")) {
      return res.status(400).json({
        error: "Invalid Stripe Secret Key. Your STRIPE_SECRET_KEY starts with 'pk_', which is a publishable key. Please provide a secret API key (starts with 'sk_') in your environment settings, or clear the key entirely to use our simulated Sandbox Stripe Checkout."
      });
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      console.log(`[Stripe Mock] Simulating checkout session for $${parsedAmount} (crediting $${parsedCreditedAmount}) for user ${user_id}`);
      const successUrl = `${req.headers.origin || "http://localhost:3000"}/wallet?session_id=mock_stripe_${Math.floor(Math.random()*1000000)}&amount=${parsedCreditedAmount}`;
      return res.json({ 
        id: `cs_test_mock_${Math.floor(Math.random()*1000000)}`, 
        url: successUrl, 
        isMock: true 
      });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Surge Stream Wallet Top Up",
                description: `Add $${parsedCreditedAmount.toFixed(2)} credits to user balance`,
              },
              unit_amount: Math.round(parsedAmount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          user_id: user_id,
          amount: parsedCreditedAmount.toString()
        },
        success_url: `${req.headers.origin || "http://localhost:3000"}/wallet?session_id={CHECKOUT_SESSION_ID}&amount=${parsedCreditedAmount}`,
        cancel_url: `${req.headers.origin || "http://localhost:3000"}/wallet?canceled=true`,
      });

      res.json({ id: session.id, url: session.url, isMock: false });
    } catch (err: any) {
      console.error("Stripe session creation error:", err);
      res.status(500).json({ error: err.message || "Failed to create Stripe checkout session" });
    }
  });

  // Confirm Stripe Checkout Session
  app.post("/api/stripe/confirm-session", async (req, res) => {
    const { session_id, user_id, amount: requestedAmount } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Deduplicate transaction to prevent double spending
    const existingTx = transactions.find(t => t.description.includes(session_id));
    if (existingTx) {
      return res.json({ success: true, already_processed: true, new_balance: profile.balance });
    }

    if (session_id.startsWith("mock_stripe_")) {
      const amountParam = Number(requestedAmount || 10);
      profile.balance = Number((profile.balance + amountParam).toFixed(2));

      transactions.push({
        id: "tx-" + Math.floor(100000 + Math.random() * 900000),
        user_id: user_id,
        type: "deposit",
        amount: amountParam,
        description: `Deposited $${amountParam.toFixed(2)} via Stripe (Mock Session: ${session_id})`,
        created_at: new Date().toISOString()
      });

      return res.json({ success: true, new_balance: profile.balance, amount: amountParam });
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      return res.status(400).json({ error: "Stripe is not configured and this is not a mock session" });
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid") {
        const amount = Number(session.metadata?.amount || (session.amount_total ? session.amount_total / 100 : 0));
        profile.balance = Number((profile.balance + amount).toFixed(2));

        transactions.push({
          id: "tx-" + Math.floor(100000 + Math.random() * 900000),
          user_id: user_id,
          type: "deposit",
          amount: amount,
          description: `Deposited $${amount.toFixed(2)} via Stripe (Session ID: ${session_id})`,
          created_at: new Date().toISOString()
        });

        res.json({ success: true, new_balance: profile.balance, amount });
      } else {
        res.status(400).json({ error: "Checkout session is not paid" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to verify Stripe checkout session" });
    }
  });

  // Multi-Player Battles State (Battle Arena)
  app.get("/api/battles", (req, res) => {
    res.json(battles);
  });

  app.post("/api/battles/create", (req, res) => {
    const { host_id, box_id, max_players } = req.body;
    const hostProfile = profiles.find(p => p.id === host_id);
    const box = seedBoxes.find(b => b.id === box_id);

    if (!hostProfile || !box) return res.status(400).json({ error: "Invalid host or box" });

    // Secure deduct box entry price upfront
    if (hostProfile.balance < box.price) {
      return res.status(400).json({ error: "Insufficient balance to host unboxing battle" });
    }

    hostProfile.balance = Number((hostProfile.balance - box.price).toFixed(2));
    
    const newBattle: Battle = {
      id: "battle-" + Math.floor(100000 + Math.random() * 900000),
      host_id: host_id,
      box_id: box_id,
      max_players: max_players || 2,
      status: 'lobby',
      created_at: new Date().toISOString(),
      box: box,
      participants: [{
        id: "bp-" + Math.floor(100000 + Math.random() * 900000),
        battle_id: "", // Filled next
        user_id: host_id,
        username: hostProfile.username,
        avatar_url: hostProfile.avatar_url,
        is_ready: true
      }]
    };
    newBattle.participants[0].battle_id = newBattle.id;
    battles.push(newBattle);

    transactions.push({
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: host_id,
      type: "unbox",
      amount: -box.price,
      description: `Joined Battle Arena (Lobby created for ${box.name})`,
      created_at: new Date().toISOString()
    });

    res.json(newBattle);
  });

  app.post("/api/battles/join", (req, res) => {
    const { battle_id, user_id } = req.body;
    const battle = battles.find(b => b.id === battle_id);
    if (!battle) return res.status(404).json({ error: "Battle lobby not found" });

    if (battle.status !== 'lobby') {
      return res.status(400).json({ error: "Battle has already commenced or finished" });
    }

    if (battle.participants.find(p => p.user_id === user_id)) {
      return res.status(400).json({ error: "Already in battle lobby" });
    }

    if (battle.participants.length >= battle.max_players) {
      return res.status(400).json({ error: "Battle lobby is full" });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "User not found" });

    const box = seedBoxes.find(b => b.id === battle.box_id);
    if (!box) return res.status(400).json({ error: "Box invalid" });

    // Secure deduct entrance price
    if (profile.balance < box.price) {
      return res.status(400).json({ error: "Sufficient credits required to enter unbox match" });
    }

    profile.balance = Number((profile.balance - box.price).toFixed(2));

    battle.participants.push({
      id: "bp-" + Math.floor(100000 + Math.random() * 900000),
      battle_id: battle.id,
      user_id: user_id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      is_ready: true
    });

    transactions.push({
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      user_id: user_id,
      type: "unbox",
      amount: -box.price,
      description: `Entered unboxing match in Battle Arena vs competitors`,
      created_at: new Date().toISOString()
    });

    // Auto commencement if lobby is full
    if (battle.participants.length === battle.max_players) {
      battle.status = 'active';
      battle.countdown_end_at = new Date(Date.now() + 5000).toISOString(); // 5s spin countdown
      
      // Compute unboxed drops for each participant server-side
      const boxItems = seedItems[battle.box_id];
      let winningVal = -1;
      let winnerId = "";

      battle.participants.forEach(p => {
        const drop = rollItem(boxItems);
        p.item_id = drop.id;
        p.item_name = drop.name;
        p.item_rarity = drop.rarity;
        p.item_value = drop.value;

        // Inventory addition for each drop
        inventories.push({
          id: "inv-" + Math.floor(100000 + Math.random() * 900000),
          user_id: p.user_id,
          item_id: drop.id,
          box_name: box.name,
          status: "inventory",
          sell_price: Number((drop.value * 0.8).toFixed(2)),
          created_at: new Date().toISOString(),
          item: drop
        });

        if (drop.value > winningVal) {
          winningVal = drop.value;
          winnerId = p.user_id;
        }
      });

      // Apply multiplier 1.25x to Battle winner's balance
      battle.winner_id = winnerId;
      battle.status = 'completed';

      const winnerProfile = profiles.find(p => p.id === winnerId);
      if (winnerProfile) {
        // Winner gets 1.25x their drops worth added back as bonus prize points/credits
        const bonusReward = Number((winningVal * 1.25).toFixed(2));
        winnerProfile.balance = Number((winnerProfile.balance + bonusReward).toFixed(2));

        transactions.push({
          id: "tx-" + Math.floor(100000 + Math.random() * 900000),
          user_id: winnerId,
          type: "battle_win",
          amount: bonusReward,
          description: `Won Battle Arena match (1.25x Item Value payout bonus: +$${bonusReward})`,
          created_at: new Date().toISOString()
        });

        chatMessages.push({
          id: "chat-battle-" + Math.floor(100000 + Math.random() * 900000),
          username: "Battle Arena",
          text: `🏆 ${winnerProfile.username} has WON the Battle Arena! Pulled "${battle.participants.find(p => p.user_id === winnerId)?.item_name}" and claimed an additional 1.25x drop payout worth $${bonusReward}!`,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json(battle);
  });

  // --- MINI-GAMES ENDPOINTS ---

  // Game 1: Bingo King
  app.post("/api/games/bingo/buy", (req, res) => {
    const { user_id } = req.body;
    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const cardCost = 15.00;

    // --- SECURE SUPABASE TRANSACTION (SIMULATED FOR ATOMICITY) ---
    // DB Query Plan:
    // BEGIN;
    // SELECT balance FROM profiles WHERE id = $1 FOR UPDATE;
    // UPDATE profiles SET balance = balance - $2 WHERE id = $1;
    // INSERT INTO transactions (id, user_id, type, amount, description) VALUES (...);
    // COMMIT;

    console.log(`[SUPABASE TRANSACTION - BEGIN] Initiating purchase of Bingo card for user: ${user_id}`);
    
    if (profile.balance < cardCost) {
      console.log(`[SUPABASE TRANSACTION - ROLLBACK] User balance ${profile.balance} is less than card cost ${cardCost}`);
      return res.status(400).json({ error: "Insufficient balance to purchase Bingo King card ($15.00)" });
    }

    // Capture original balance for rollback safety
    const originalBalance = profile.balance;

    try {
      // Execute Atomic Deduction
      profile.balance = Number((profile.balance - cardCost).toFixed(2));
      console.log(`[SUPABASE TRANSACTION - DEDUCT] Deducted $${cardCost} from user. New balance: ${profile.balance}`);

      // Generate random card (5x5 grid, numbers 1-75)
      const card: number[][] = Array.from({ length: 5 }, (_, r) => 
        Array.from({ length: 5 }, () => Math.floor(1 + Math.random() * 75))
      );
      // FREE SPACE at center
      card[2][2] = 0;

      // Simulate 35 calls immediately
      const called_numbers: number[] = [];
      while (called_numbers.length < 35) {
        const num = Math.floor(1 + Math.random() * 75);
        if (!called_numbers.includes(num)) called_numbers.push(num);
      }

      // Count matches (excluding free center spot)
      let matchesCount = 0;
      card.forEach((row, r) => row.forEach((val, c) => {
        if (r === 2 && c === 2) return;
        if (called_numbers.includes(val)) matchesCount++;
      }));

      // Reward payout calculation based on matches count
      const win = matchesCount >= 10;
      const prize = win ? Math.floor(matchesCount * 4) : 0;
      
      if (win) {
        profile.balance = Number((profile.balance + prize).toFixed(2));
        profile.loyalty_points += 15; // loyalty resource bonus
        console.log(`[SUPABASE TRANSACTION - CREDIT] User won! Credited $${prize} and +15 XP`);
      }

      const bingoState: BingoState = {
        id: "bingo-" + Math.floor(100000 + Math.random() * 900000),
        user_id: user_id,
        card,
        called_numbers,
        progress: Math.floor((matchesCount / 24) * 100),
        won: win,
        purchased_at: new Date().toISOString()
      };

      bingoCards.push(bingoState);

      // Log secure transactions to ledger inside the same atomic boundary
      const buyTxId = "tx-" + Math.floor(100000 + Math.random() * 900000);
      transactions.push({
        id: buyTxId,
        user_id,
        type: "bingo_buy",
        amount: -cardCost,
        description: `Purchased Bingo King 75-call card (Verified Ref: ${buyTxId})`,
        created_at: new Date().toISOString()
      });

      if (win) {
        const winTxId = "tx-" + Math.floor(100000 + Math.random() * 900000);
        transactions.push({
          id: winTxId,
          user_id,
          type: "bingo_win",
          amount: prize,
          description: `Won Bingo King payout with ${matchesCount} number matches (+15 loyalty resources) (Verified Ref: ${winTxId})`,
          created_at: new Date().toISOString()
        });
      }

      console.log(`[SUPABASE TRANSACTION - COMMIT] Transaction successfully finalized and persisted to ledger.`);

      res.json({
        success: true,
        bingo: bingoState,
        matches: matchesCount,
        prize_won: prize,
        new_balance: profile.balance
      });

    } catch (error) {
      // In case of any unhandled runtime error during processing, trigger automatic state rollback to maintain credit security
      profile.balance = originalBalance;
      console.error(`[SUPABASE TRANSACTION - FATAL ROLLBACK] Transaction failed, state reverted to original balance ${originalBalance}:`, error);
      res.status(500).json({ error: "Secure Supabase ledger transaction failed. Balance was fully rolled back safely." });
    }
  });

  // Game 2: Pick-5 Lottery
  app.post("/api/games/lottery/buy", (req, res) => {
    const { user_id, chosen_numbers } = req.body;
    if (!chosen_numbers || chosen_numbers.length !== 5) {
      return res.status(400).json({ error: "Exactly 5 lottery ticket numbers must be chosen." });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const ticketPrice = 10.00;

    // --- SECURE SUPABASE TRANSACTION (SIMULATED FOR ATOMICITY) ---
    // DB Query Plan:
    // BEGIN;
    // SELECT balance FROM profiles WHERE id = $1 FOR UPDATE;
    // UPDATE profiles SET balance = balance - $2 WHERE id = $1;
    // INSERT INTO transactions (id, user_id, type, amount, description) VALUES (...);
    // COMMIT;

    console.log(`[SUPABASE TRANSACTION - BEGIN] Initiating purchase of Pick-5 Lottery Ticket for user: ${user_id}`);

    if (profile.balance < ticketPrice) {
      console.log(`[SUPABASE TRANSACTION - ROLLBACK] User balance ${profile.balance} is less than ticket price ${ticketPrice}`);
      return res.status(400).json({ error: "Insufficient balance for Pick-5 Lottery ticket ($10.00)" });
    }

    // Capture original balance for rollback safety
    const originalBalance = profile.balance;

    try {
      // Execute Atomic Deduction
      profile.balance = Number((profile.balance - ticketPrice).toFixed(2));
      console.log(`[SUPABASE TRANSACTION - DEDUCT] Deducted $${ticketPrice} from user. New balance: ${profile.balance}`);

      // Draw standard winning numbers (1 to 50)
      const winning: number[] = [];
      while (winning.length < 5) {
        const drawn = Math.floor(1 + Math.random() * 50);
        if (!winning.includes(drawn)) winning.push(drawn);
      }

      // Evaluate matches
      const matches = chosen_numbers.filter((n: number) => winning.includes(n)).length;

      // Define premium tier drops
      let prize = 0;
      let rewardDescription = "";
      if (matches === 1) { prize = 5.00; rewardDescription = "$5.00 Credit Match"; }
      else if (matches === 2) { prize = 20.00; rewardDescription = "$20.00 Credit Match"; }
      else if (matches === 3) { prize = 100.00; rewardDescription = "Epic $100.00 Premium Match"; }
      else if (matches === 4) { prize = 500.00; rewardDescription = "Mega $500.00 Premium Match"; }
      else if (matches === 5) { prize = 2500.00; rewardDescription = "JACKPOT $2500.00 Hype Drop Match!"; }

      if (prize > 0) {
        profile.balance = Number((profile.balance + prize).toFixed(2));
        console.log(`[SUPABASE TRANSACTION - CREDIT] User won Pick-5! Credited $${prize}`);
      }

      const lotState: LotteryState = {
        id: "lottery-" + Math.floor(100000 + Math.random() * 900000),
        user_id,
        numbers: chosen_numbers,
        status: prize > 0 ? "win" : "lose",
        winning_numbers: winning,
        matches_count: matches,
        win_value: prize,
        created_at: new Date().toISOString()
      };

      lotteryTickets.push(lotState);

      // Log secure transactions to ledger inside the same atomic boundary
      const buyTxId = "tx-" + Math.floor(100000 + Math.random() * 900000);
      transactions.push({
        id: buyTxId,
        user_id,
        type: "lottery_buy",
        amount: -ticketPrice,
        description: `Entered Pick-5 Daily Lottery (Numbers: ${chosen_numbers.join(", ")}) (Verified Ref: ${buyTxId})`,
        created_at: new Date().toISOString()
      });

      if (prize > 0) {
        const winTxId = "tx-" + Math.floor(100000 + Math.random() * 900000);
        transactions.push({
          id: winTxId,
          user_id,
          type: "lottery_win",
          amount: prize,
          description: `Won Pick-5 Lottery: ${rewardDescription} (${matches} number matches) (Verified Ref: ${winTxId})`,
          created_at: new Date().toISOString()
        });
      }

      console.log(`[SUPABASE TRANSACTION - COMMIT] Transaction successfully finalized and persisted to ledger.`);

      res.json({
        success: true,
        lottery: lotState,
        winning_numbers: winning,
        matches,
        prize_won: prize,
        new_balance: profile.balance
      });

    } catch (error) {
      // In case of any unhandled runtime error during processing, trigger automatic state rollback to maintain credit security
      profile.balance = originalBalance;
      console.error(`[SUPABASE TRANSACTION - FATAL ROLLBACK] Transaction failed, state reverted to original balance ${originalBalance}:`, error);
      res.status(500).json({ error: "Secure Supabase ledger transaction failed. Balance was fully rolled back safely." });
    }
  });

  // Game 3: Item Upgrader
  // Security Constraint: Ensures item is consumed on the line for 45% probability chance to scale value x1.5
  app.post("/api/games/upgrade", (req, res) => {
    const { user_id, item_id } = req.body;
    const itemIndex = inventories.findIndex(inv => inv.id === item_id && inv.user_id === user_id && inv.status === 'inventory');
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Selected item not in active inventory" });
    }

    const profile = profiles.find(p => p.id === user_id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const invItem = inventories[itemIndex];
    const originalValue = invItem.item?.value || 10;

    // Roll upgraded probability (Exactly 45% success rate)
    const upgradeRoll = Math.random();
    const isSuccess = upgradeRoll < 0.45;

    if (isSuccess) {
      // 1.5x Worth Scaling
      const newValue = Number((originalValue * 1.5).toFixed(2));
      invItem.status = 'upgraded_won';
      
      // Add a custom scaled item into user's inventory
      const upgradedItem: BoxItem = {
        id: `upg-${invItem.item?.id || 'item'}`,
        box_id: invItem.item?.box_id || 'manual',
        name: `Upgraded ★ ${invItem.item?.name || 'Item'}`,
        image_url: invItem.item?.image_url || '',
        value: newValue,
        rarity: 'legendary',
        probability: 0
      };

      inventories.push({
        id: "inv-" + Math.floor(100000 + Math.random() * 900000),
        user_id,
        item_id: upgradedItem.id,
        box_name: invItem.box_name,
        status: "inventory",
        sell_price: Number((newValue * 0.8).toFixed(2)),
        created_at: new Date().toISOString(),
        item: upgradedItem
      });

      transactions.push({
        id: "tx-" + Math.floor(100000 + Math.random() * 900000),
        user_id,
        type: "upgrade_win",
        amount: 0,
        description: `★ Item Upgrader Success! Scaled ${invItem.item?.name} value to $${newValue}`,
        created_at: new Date().toISOString()
      });

      res.json({
        success: true,
        upgraded: true,
        new_value: newValue,
        message: `Upgrader Success! Scaled to ★ ${newValue}!`
      });
    } else {
      // Item lost
      invItem.status = 'upgraded_lost';

      transactions.push({
        id: "tx-" + Math.floor(100000 + Math.random() * 900000),
        user_id,
        type: "upgrade_loss",
        amount: -originalValue,
        description: `✕ Item Upgrader Lost: "${invItem.item?.name}" ($${originalValue}) incinerated during upgrade attempt.`,
        created_at: new Date().toISOString()
      });

      res.json({
        success: true,
        upgraded: false,
        message: `Upgrader Failed. Item has been incinerated.`
      });
    }
  });

  // Get Live Feed
  app.get("/api/live-feed", (req, res) => {
    res.json(liveFeed);
  });

  // Chat Feed
  app.get("/api/chat", (req, res) => {
    res.json(chatMessages);
  });

  app.post("/api/chat/send", (req, res) => {
    const { username, text } = req.body;
    if (!text || !username) return res.status(400).json({ error: "Missing fields" });

    const message: ChatMessage = {
      id: "chat-" + Math.floor(100000 + Math.random() * 900000),
      username,
      text,
      timestamp: new Date().toISOString()
    };
    chatMessages.push(message);
    if (chatMessages.length > 100) chatMessages.shift();
    res.json(message);
  });

  // Fetch Inventory
  app.get("/api/inventory/:userId", (req, res) => {
    const userInv = inventories.filter(inv => inv.user_id === req.params.userId);
    res.json(userInv);
  });

  // Fetch Transactions Ledger Log
  app.get("/api/transactions/:userId", (req, res) => {
    const userTxs = transactions.filter(tx => tx.user_id === req.params.userId);
    res.json(userTxs);
  });

  // Fetch shipments for Admin Panel
  app.get("/api/admin/shipments", (req, res) => {
    const shippedItems = inventories.filter(inv => inv.status === 'shipped');
    const responseData = shippedItems.map(inv => {
      const user = profiles.find(p => p.id === inv.user_id);
      return {
        id: inv.id,
        username: user ? user.username : "Unknown",
        itemName: inv.item?.name || "Unknown Item",
        shippingAddress: user ? user.shipping_address : "No address listed",
        status: "processing",
        trackingLabel: inv.shipping_label
      };
    });
    res.json(responseData);
  });

  // Process Shipment
  app.post("/api/admin/shipments/:id/process", (req, res) => {
    const { id } = req.params;
    const inv = inventories.find(item => item.id === id);
    if (!inv) {
      return res.status(404).json({ error: "Shipment item not found" });
    }
    inv.status = 'processed';
    res.json({
      success: true,
      message: `Successfully processed and shipped tracking label ${inv.shipping_label || 'N/A'}`
    });
  });

  // Admin sync statistics
  app.post("/api/admin-sync", (req, res) => {
    // Admin operations recalculate statistics using service role simulating privileges
    const { service_key } = req.body;
    if (service_key !== "SUPABASE_SERVICE_ROLE_KEY" && service_key !== "admin-dev-key") {
      return res.status(401).json({ error: "Unauthorized access boundary check failed" });
    }

    // Recalculate unbox totals
    seedBoxes.forEach(box => {
      const count = inventories.filter(inv => inv.box_name === box.name).length;
      box.total_opened = count + Math.floor(50 + Math.random() * 10);
    });

    res.json({
      success: true,
      message: "Synced statistics, updated counters and leaderboards seamlessly."
    });
  });

  // Leaderboard statistics
  app.get("/api/leaderboard", (req, res) => {
    // Auto rank profiles
    const leaderboardData = profiles.map(p => {
      // Aggregate winnings from transaction ledger
      const wins = transactions.filter(t => t.user_id === p.id && t.type === 'battle_win').length;
      const unboxVal = inventories.filter(i => i.user_id === p.id).reduce((sum, item) => sum + (item.item?.value || 0), 0);
      return {
        id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        total_wins: wins + Math.floor(p.balance / 120),
        total_value: Number(unboxVal.toFixed(2)) + Number((p.balance * 1.5).toFixed(2))
      };
    }).sort((a, b) => b.total_value - a.total_value);

    res.json(leaderboardData);
  });

  // --- SERVING THE CLIENT (VITE MIDDLEWARE IN DEV, STATIC IN PROD) ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on host 0.0.0.0, port ${PORT}`);
  });
}

startServer();
