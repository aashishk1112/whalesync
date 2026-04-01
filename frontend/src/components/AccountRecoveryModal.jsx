import React, { useState } from 'react';
import { Shield, RotateCcw, Sparkles, TrendingUp, Users, Clock, AlertTriangle, ArrowRight, Zap } from 'lucide-react';

const AccountRecoveryModal = ({ isOpen, onClose, recoveryData, onRestore, onStartFresh }) => {
  const [showConfirmFresh, setShowConfirmFresh] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const stats = recoveryData?.stats || {
    rank: "#42",
    roi: "+18.4%",
    followers: "128 copiers",
    last_active: "2 weeks ago"
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    await onRestore(recoveryData.email);
    setIsProcessing(false);
  };

  const handleStartFresh = async () => {
    setIsProcessing(true);
    await onStartFresh(recoveryData.email);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[480px] glass-panel-unified shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-400 border-white/10">
        
        {/* Header Decor */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />
        
        {!showConfirmFresh ? (
          <div className="p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl text-primary mb-6 border border-primary/20 shadow-[0_0_20px_rgba(0,212,255,0.15)]">
                <Shield size={28} />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                Previous <span className="text-primary italic-none">Identity</span> <span className="text-white/20 italic-none">Found</span>
              </h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-4">
                Re-linking Protocol: Select your entry vector
              </p>
            </div>
 
            {/* Highlight Card */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-10 relative group overflow-hidden hover:bg-white/[0.05] transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={48} className="text-primary" />
              </div>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 relative z-10">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Global Rank</span>
                  <div className="text-xl font-black text-white italic">{stats.rank}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Peak ROI</span>
                  <div className="text-xl font-black text-emerald-400 italic">{stats.roi}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Community</span>
                  <div className="text-xl font-black text-white italic">{stats.followers}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Status</span>
                  <div className="text-xl font-black text-slate-400 italic">{stats.last_active}</div>
                </div>
              </div>
 
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide leading-relaxed">
                  System detected a prior registration for this account. You may <span className="text-white">resume</span> your previous alpha trajectory or <span className="text-white">reset</span> metrics.
                </p>
              </div>
            </div>
 
            {/* Options */}
            <div className="space-y-4">
              <button
                onClick={handleRestore}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-5 bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all rounded-2xl text-white group shadow-[0_10px_30px_rgba(0,212,255,0.15)]"
              >
                <div className="text-left">
                  <div className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <RotateCcw size={16} />
                    Restore Previous Alpha
                  </div>
                  <div className="text-[9px] font-bold opacity-70 mt-1 uppercase tracking-tight">Maintains ROI, Streak, and Copier Network</div>
                </div>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
 
              <button
                onClick={() => setShowConfirmFresh(true)}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all rounded-2xl text-slate-400 group border border-white/5"
              >
                <div className="text-left">
                  <div className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white/80">
                    <Sparkles size={16} />
                    Initiate Fresh Start
                  </div>
                  <div className="text-[9px] font-bold opacity-40 mt-1 uppercase tracking-tight">Wipes all history. Leaderboard lock applied.</div>
                </div>
                <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-10">
            {/* Confirmation Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-500/10 rounded-2xl text-red-500 mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                <AlertTriangle size={28} />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                Confirm <span className="text-red-500 italic-none">Wipe?</span>
              </h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-4 px-6">
                Irreversible Data Erasure Protocol
              </p>
            </div>
 
            {/* Warning Message */}
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 mb-10">
              <ul className="space-y-3">
                {[
                  "Global ranking reset to base level",
                  "Verified ROI history archived permanently",
                  "Mandatory 7-day leaderboard cooldown",
                  "Community followers/badges revoked"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-red-400/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
 
            {/* Confirmation Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmFresh(false)}
                className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all border border-white/5"
              >
                Abort
              </button>
              <button
                onClick={handleStartFresh}
                disabled={isProcessing}
                className="flex-1 py-5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-red-500/20"
              >
                {isProcessing ? "Erasing..." : "Execute Wipe"}
              </button>
            </div>
          </div>
        )}
 
        {/* Footer */}
        <div className="px-10 py-5 bg-white/[0.02] border-t border-white/5 flex items-center justify-center gap-3">
          <Lock size={12} className="text-slate-500" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
            Institutional <span className="text-white">Security</span> Overlay Active
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountRecoveryModal;
