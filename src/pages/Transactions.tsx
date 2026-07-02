import React, { useEffect, useState } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../utils/formatCurrency';
import { Wallet, CreditCard, DollarSign, Calendar, Info, RefreshCw, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function Transactions() {
  const { profile, refreshProfile } = useAuthStore();
  const { transactions, isLoading, fetchTransactions, depositFunds } = useWalletStore();

  const [depositAmount, setDepositAmount] = useState('50');
  const [depositMethod, setDepositMethod] = useState<'Credit Card' | 'PayPal' | 'Crypto'>('Credit Card');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchTransactions(profile.id);
    }
  }, [profile?.id]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return toast.error("Please login first to top up");

    const parsed = parseFloat(depositAmount);
    if (isNaN(parsed) || parsed <= 0) {
      return toast.error("Please specify a valid positive deposit amount.");
    }

    setIsProcessing(true);
    try {
      const res = await depositFunds(profile.id, parsed, depositMethod);
      toast.success(res.message);
      setDepositAmount('50');
      refreshProfile();
    } catch (err: any) {
      toast.error("Deposit processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Wallet balance display card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-orange-500">
            <Wallet className="h-5 w-5 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tight italic text-white">Financial Wallet & Ledger</h2>
          </div>
          <p className="text-xs text-white/60">
            Secure virtual currency top-ups and complete audited history logs.
          </p>
        </div>

        <div className="flex flex-col md:items-end">
          <span className="font-sans text-[10px] uppercase text-white/40 tracking-widest font-bold leading-none">Wallet Balance</span>
          <span className="font-mono text-2xl font-black text-orange-500 mt-2 leading-none">
            {profile ? formatCurrency(profile.balance) : '$0.00'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Deposit/Secure Top-Up Form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
            <CreditCard className="h-4.5 w-4.5 text-orange-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Secure Deposit Gateways
            </h3>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
                Deposit Method
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Credit Card', 'PayPal', 'Crypto'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setDepositMethod(method)}
                    className={`rounded-lg border py-2 px-1 text-center font-sans text-[10px] font-black uppercase tracking-wider transition-all relative cursor-pointer ${
                      depositMethod === method 
                        ? 'bg-orange-500 text-black border-orange-500 shadow-lg shadow-orange-500/20' 
                        : 'border-white/10 text-white/40 bg-black/40 hover:bg-white/5'
                    }`}
                  >
                    {method}
                    {method === 'Crypto' && (
                      <span className="absolute -top-1.5 -right-1 px-1 bg-amber-500 text-black font-sans font-black text-[7px] uppercase tracking-wider rounded border border-black">
                        +5%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
                Pre-Set Amount
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['10', '25', '50', '100'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(val)}
                    className={`rounded-lg border py-1.5 font-mono text-xs font-bold transition-all cursor-pointer ${
                      depositAmount === val 
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400' 
                        : 'border-white/10 text-white/40 bg-black/40 hover:bg-white/5'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
                Custom Deposit Amount ($)
              </label>
              <input
                type="number"
                min="5"
                max="5000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500"
                placeholder="50"
                required
              />
            </div>

            {depositMethod === 'Crypto' && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-start space-x-2.5 animate-pulse">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-amber-500/95 leading-normal font-sans uppercase font-black tracking-wide">
                  Crypto Promo active: We will credit an additional **5% deposit bonus** instantly to your profile!
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-orange-500 py-3 font-sans text-xs font-black uppercase tracking-wider text-black hover:bg-orange-400 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 text-black" />
              <span>{isProcessing ? "PROCESSING SECURE GATEWAY..." : `SECURE DEPOSIT ${formatCurrency(parseFloat(depositAmount) || 0)}`}</span>
            </button>
          </form>
        </div>

        {/* Financial Ledger Log Lists */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-white/5 pb-2">
            Detailed Transaction Ledger
          </h3>

          {isLoading && (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          )}

          {!isLoading && transactions.length === 0 && (
            <div className="text-center py-16 font-mono text-white/30 text-xs">
              No ledger entries logged on this account yet.
            </div>
          )}

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {transactions.map(tx => {
              const isPositive = tx.amount >= 0;
              const typeBadges: Record<string, string> = {
                deposit: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                unbox: 'bg-red-500/10 text-red-400 border-red-500/20',
                sell: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                upgrade_win: 'bg-[#FF3DF5]/10 text-[#FF3DF5] border-[#FF3DF5]/20',
                upgrade_loss: 'bg-red-500/10 text-red-400 border-red-500/20',
                bingo_buy: 'bg-slate-800/20 text-slate-300 border-slate-800',
                bingo_win: 'bg-[#00E6FF]/10 text-[#00E6FF] border-[#00E6FF]/20',
                lottery_buy: 'bg-slate-800/20 text-slate-300 border-slate-800',
                lottery_win: 'bg-[#00E6FF]/10 text-[#00E6FF] border-[#00E6FF]/20',
                shipping_fee: 'bg-slate-800/20 text-slate-300 border-slate-800',
                battle_win: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              };

              return (
                <div 
                  key={tx.id}
                  className="rounded-xl border border-white/5 bg-black/40 p-3 flex items-center justify-between font-mono text-xs hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-[10px] text-white/40 shrink-0">
                      <Calendar className="h-3.5 w-3.5 mb-1 text-white/30" />
                      <span>{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="block text-white font-bold">{tx.description}</span>
                      <span className={`inline-block rounded px-1.5 py-0.2 text-[8px] font-sans font-black uppercase tracking-wider border ${typeBadges[tx.type] || 'bg-white/5 border-white/10 text-white/60'}`}>
                        {tx.type}
                      </span>
                    </div>
                  </div>

                  <span className={`font-mono font-black text-sm shrink-0 ${isPositive ? 'text-orange-500' : 'text-white/40'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
