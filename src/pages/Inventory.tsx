import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import ItemCard from '../components/ItemCard';
import { Package, ShieldCheck, Sparkles, AlertTriangle, Truck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/formatCurrency';

export default function Inventory() {
  const { profile, refreshProfile } = useAuthStore();
  const { items, isLoading, fetchInventory, resell, shipItem, upgradeItemOnLine } = useInventoryStore();

  const [activeTab, setActiveTab] = useState<'all' | 'unboxed' | 'shipped' | 'sold'>('all');
  
  // Upgrader states
  const [selectedUpgradeItemId, setSelectedUpgradeItemId] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchInventory(profile.id);
    }
  }, [profile?.id]);

  const handleSell = async (id: string) => {
    if (!profile) return;
    try {
      await resell(id, profile.id);
      toast.success("Item liquidated and balance credited successfully!");
      refreshProfile();
    } catch (e: any) {
      toast.error(e.message || "Resell failed");
    }
  };

  const handleShip = async (id: string) => {
    if (!profile) return;
    if (!profile.shipping_address) {
      return toast.error("Please configure your physical home delivery shipping address in Profile page first!");
    }

    try {
      const label = await shipItem(id, profile.id, profile.shipping_address);
      toast.success(`Home physical shipment request label created: ${label}`);
      refreshProfile();
    } catch (e: any) {
      toast.error(e.message || "Physical shipping request failed");
    }
  };

  const handleUpgradeLauncher = async () => {
    if (!profile || !selectedUpgradeItemId) return;
    const item = items.find(i => i.id === selectedUpgradeItemId);
    if (!item) return;

    setIsUpgrading(true);
    setUpgradeResult(null);

    try {
      const res = await upgradeItemOnLine(profile.id, selectedUpgradeItemId);
      setUpgradeResult(res);
      refreshProfile();
      if (res.upgraded) {
        toast.success(`🎉 SUCCESS! Item upgraded with 1.5x worth scaling!`);
      } else {
        toast.error(`✕ Loss: Upgrade failed. Item incinerated.`);
      }
      setSelectedUpgradeItemId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger upgrader");
    } finally {
      setIsUpgrading(false);
    }
  };

  // Filter items by tab
  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return item.status !== 'sold' && item.status !== 'upgraded_lost';
    if (activeTab === 'unboxed') return item.status === 'inventory';
    if (activeTab === 'shipped') return item.status === 'shipped';
    if (activeTab === 'sold') return item.status === 'sold';
    return true;
  });

  const selectedUpgradeItem = items.find(i => i.id === selectedUpgradeItemId);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Upper stats summary */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-orange-500">
            <Package className="h-5 w-5 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tight italic text-white">My Loot Inventory</h2>
          </div>
          <p className="text-xs text-white/60">
            View, liquidate, or ship your unboxed premium drops. Upgrade items for scaled worth values!
          </p>
        </div>

        <div className="flex gap-4 text-xs font-sans">
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl min-w-[120px]">
            <span className="block text-white/40 uppercase font-bold text-[9px] tracking-wider">Total Won</span>
            <span className="block text-white font-black text-sm mt-0.5">{items.length} Drops</span>
          </div>
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl min-w-[140px]">
            <span className="block text-white/40 uppercase font-bold text-[9px] tracking-wider">Active Portfolio</span>
            <span className="block text-orange-500 font-black text-sm mt-0.5">
              {formatCurrency(items.filter(i => i.status === 'inventory').reduce((sum, i) => sum + (i.item?.value || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Dynamic Item Upgrader Sandbox Module */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
            <Sparkles className="h-4.5 w-4.5 text-orange-500 animate-spin-slow" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              ★ Item Upgrader (45% Win)
            </h3>
          </div>

          <p className="text-[10px] text-white/40 leading-relaxed font-mono">
            Put any won item from your inventory on the line. Wins scale the item value by **1.5x** with a calibrated **45% probability chance**! Losses incinerate the item.
          </p>

          {/* Upgrader Box Area Slot */}
          <div className="relative rounded-xl border-2 border-dashed border-white/10 bg-black/40 p-6 flex flex-col items-center justify-center min-h-[160px] text-center">
            {selectedUpgradeItem ? (
              <div className="space-y-3">
                <img 
                  src={selectedUpgradeItem.item?.image_url} 
                  alt={selectedUpgradeItem.item?.name} 
                  className="h-20 w-20 object-contain mx-auto animate-pulse" 
                />
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-white uppercase tracking-tight">{selectedUpgradeItem.item?.name}</span>
                  <span className="block text-xs font-mono font-black text-white/60">
                    Current worth: {formatCurrency(selectedUpgradeItem.item?.value || 0)}
                  </span>
                  <span className="block text-[10px] font-mono text-orange-400 font-black">
                    Upgraded worth: {formatCurrency(Number(((selectedUpgradeItem.item?.value || 0) * 1.5).toFixed(2)))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <AlertTriangle className="h-6 w-6 text-white/20 mx-auto animate-bounce" />
                <p className="text-xs text-white/40 font-bold uppercase tracking-wide">
                  No Item Placed
                </p>
                <p className="text-[9px] text-white/30 font-mono">
                  Click the Upgraders CTA buttons on cards below to slot your item here.
                </p>
              </div>
            )}
          </div>

          {/* Upgrader Controls */}
          <button
            disabled={isUpgrading || !selectedUpgradeItemId}
            onClick={handleUpgradeLauncher}
            className="w-full rounded-lg bg-orange-500 py-3 font-sans text-xs font-black uppercase text-black transition-all hover:bg-orange-400 disabled:opacity-40 cursor-pointer shadow-lg shadow-orange-500/20"
          >
            {isUpgrading ? "CALIBRATING FIELD..." : "ENGAGE 45% UPGRADE"}
          </button>

          {upgradeResult && (
            <div className={`p-3 rounded-lg border text-center font-sans text-xs font-black uppercase tracking-wider ${
              upgradeResult.success && upgradeResult.message.includes("Success")
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 animate-bounce' 
                : 'bg-red-500/10 border-red-500/25 text-red-500'
            }`}>
              {upgradeResult.message}
            </div>
          )}
        </div>

        {/* Inventory Items Showcase Grid List */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 flex-wrap gap-2">
            
            {/* Filter Tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All Active' },
                { id: 'unboxed', label: 'Unboxed Keepers' },
                { id: 'shipped', label: 'Shipped Home' },
                { id: 'sold', label: 'Liquidated Logs' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`rounded-lg px-3 py-1.5 font-sans text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-orange-500 text-black border-orange-500 font-black' 
                      : 'border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-white/40 font-bold uppercase">
              Matches: <strong className="text-white/60">{filteredItems.length} items</strong>
            </span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-orange-500 border-white/10"></div>
            </div>
          )}

          {!isLoading && filteredItems.length === 0 && (
            <div className="text-center py-20 font-mono text-white/30 text-xs">
              No virtual items found matching filters.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div key={item.id}>
                <ItemCard 
                  item={item} 
                  onSell={handleSell}
                  onShip={handleShip}
                  onUpgrade={(id) => {
                    setSelectedUpgradeItemId(id);
                    setUpgradeResult(null);
                    toast.success("Item placed on upgrader! Scroll up to review.");
                  }}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
