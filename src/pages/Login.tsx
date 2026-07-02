import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in email and password fields");

    setIsProcessing(true);
    try {
      await login(email);
      toast.success("Welcome back to SurgeBox Ultra!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to log in");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsProcessing(true);
    try {
      // Simulate quick guest setup
      await login("guest@surgebox.io");
      toast.success("Connected using Guest mode!");
      navigate("/");
    } catch (err) {
      toast.error("Guest login failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleLogin = () => {
    toast.info("Connecting to Google authentication popup...");
    setTimeout(() => {
      login("google_unbox@gmail.com").then(() => {
        toast.success("Successfully logged in via Google SSO!");
        navigate("/");
      });
    }, 1200);
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6 animate-fade-in">
      
      {/* Branding Header Banner */}
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-black uppercase tracking-tight italic text-white flex items-center justify-center space-x-1.5">
          <Sparkles className="h-5 w-5 text-orange-500 animate-pulse" />
          <span>SurgeBox Ultra Auth</span>
        </h2>
        <p className="text-xs text-white/60">
          Connect your secure wallet or profiles to start unboxing.
        </p>
      </div>

      {/* Main Credentials Login Form Container */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] rounded-full pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                placeholder="collector@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-sans uppercase text-white/40 tracking-widest font-bold mb-1.5">
              Password Account Keys
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-orange-500 text-black py-3 font-sans text-xs font-black uppercase tracking-wider transition-all hover:bg-orange-400 disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-500/20"
          >
            <LogIn className="h-4 w-4 text-black" />
            <span>{isProcessing ? "CONNECTING..." : "SECURE LOGIN"}</span>
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-3 text-[10px] font-sans uppercase text-white/30 font-bold tracking-wider">Or Connect Via</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Social Authentication shortcuts */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleLogin}
            className="rounded-lg border border-white/10 bg-black/40 py-2.5 text-center font-sans text-xs font-black uppercase tracking-wider text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            Google OAuth
          </button>
          <button
            onClick={handleGuestLogin}
            className="rounded-lg border border-white/10 bg-black/40 py-2.5 text-center font-sans text-xs font-black uppercase tracking-wider text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            Guest unboxer
          </button>
        </div>

      </div>

      {/* Neutral Legal Footer Links */}
      <div className="text-center text-[10px] text-white/40 font-sans uppercase font-bold tracking-wide">
        <span>By accessing your profile, you accept our standard </span>
        <a href="#terms" className="text-orange-400 hover:text-orange-300 transition-colors">Terms of Service</a>
        <span> and </span>
        <a href="#privacy" className="text-orange-400 hover:text-orange-300 transition-colors">Privacy Policy</a>
        <span> channels.</span>
      </div>

    </div>
  );
}
