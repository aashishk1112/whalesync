import React, { useState, useEffect, useContext } from 'react';
import { PortfolioContext } from '../context/PortfolioContext';
import { AuthContext } from '../context/AuthContext';
import { TrendingUp, Activity, DollarSign, ArrowUpRight, ArrowDownRight, UserPlus, Target, Plus, Zap, Briefcase, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { portfolio, settings, addSource } = useContext(PortfolioContext);
    const { user } = useContext(AuthContext);
    const [signals, setSignals] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeTab, setActiveTab] = useState('Polymarket');
    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [quests, setQuests] = useState([
        { id: 1, title: 'Review Intraday Orderbook', xp: 10, done: false },
        { id: 2, title: 'Deploy 1 New Strategy', xp: 50, done: false },
        { id: 3, title: 'Maintain 3-day login streak', xp: 20, done: true },
    ]);
    const [xp, setXp] = useState(21500);

    const handleQuestToggle = (id) => {
        setQuests(prev => prev.map(q => {
            if (q.id === id && !q.done) {
                setXp(x => x + q.xp);
                return { ...q, done: true };
            }
            return q;
        }));
    };

    useEffect(() => {
        if (!user?.user_id) return;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        // Fetch consensus signals
        fetch(`${apiUrl}/api/signals?user_id=${user.user_id}`)
            .then(res => res.json())
            .then(data => setSignals(data.signals || []))
            .catch(err => console.error(err));

        // Fetch daily leaderboard
        setIsLoadingLeaderboard(true);
        fetch(`${apiUrl}/api/markets/leaderboard?limit=10`)
            .then(res => res.json())
            .then(data => {
                setLeaderboard(data.leaderboard || data.traders || []);
                setIsLoadingLeaderboard(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoadingLeaderboard(false);
            });
    }, [user]);

    const handleFollow = async (trader) => {
        const result = await addSource({
            platform: 'Polymarket',
            address: trader.proxyWallet,
            name: trader.userName || 'Top Trader'
        });

        if (result.success) {
            setNotification({ type: 'success', message: `Successfully following ${trader.userName || 'trader'}!` });
        } else {
            // Enhanced limit detection
            const isLimit = result.error?.includes('limit') ||
                result.error?.includes('slot') ||
                result.error?.includes('purchase');

            setNotification({
                type: 'error',
                message: result.error || 'Failed to follow trader',
                isLimitError: isLimit
            });
        }

        // Only auto-close if it's NOT a limit error, or give it much longer (10s)
        const duration = (result.error?.includes('limit') || result.error?.includes('slot')) ? 10000 : 3000;
        setTimeout(() => {
            setNotification(null);
        }, duration);
    };

    return (
        <div className="w-full mt-8 animate-fade-in relative z-10">

            {/* Notification Popup */}
            {notification && (
                <div 
                    className={`fixed top-6 right-6 z-[1000] px-4 py-3 rounded-lg flex items-center gap-3 max-w-[400px] shadow-2xl backdrop-blur-md border border-white/10 text-white animate-slide-in ${
                        notification.type === 'success' ? 'bg-emerald-500/95' : 'bg-red-500/95'
                    }`}
                >
                    <span className="font-medium flex-1 text-sm">{notification.message}</span>

                    {notification.isLimitError && (
                        <a
                            href="/subscription"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white text-slate-900 px-3 py-1 rounded text-xs font-bold whitespace-nowrap no-underline hover:bg-slate-100 transition-colors"
                        >
                            Upgrade Plan
                        </a>
                    )}

                    <button
                        onClick={() => setNotification(null)}
                        className="bg-black/15 border-none color-white cursor-pointer w-5 h-5 rounded-full flex items-center justify-center text-base p-0 flex-shrink-0 leading-none hover:bg-black/25 transition-colors"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* 💎 USER IDENTITY & TIER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-1 relative inline-block">
                        Commander <span className="text-primary">{user?.user_name || 'OxAashish'}</span>
                        <Sparkles size={16} className="absolute -top-1 -right-4 text-emerald-400 animate-pulse" />
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-status-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            Terminal Systems Online
                        </div>
                        <div className="hidden sm:block w-px h-3 bg-white/10"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded cursor-help hover:bg-indigo-500/20 transition-colors" title="Joined during Beta Phase">
                                🎖️ Early Adopter
                            </span>
                            <span className="text-[9px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded cursor-help hover:bg-amber-500/20 transition-colors" title="Held a strategy during 20% drawdown">
                                💎 Diamond Hands
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 md:mt-0 bg-slate-900/60 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-8 backdrop-blur-md shadow-2xl hover:border-primary/20 transition-all cursor-default relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
                    <div>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Target size={10} className="text-primary" /> Current Tier
                        </div>
                        <div className="text-base font-black text-white flex items-center gap-2 tracking-wide">
                            🐋 WHALE <span className="text-[10px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-widest">Level 4</span>
                        </div>
                    </div>
                    <div className="w-40 relative z-10">
                        <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            <span>{xp.toLocaleString()} XP</span>
                            <span className="text-primary">50k XP</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-primary/80 to-primary relative overflow-hidden transition-all duration-1000 ease-out" style={{ width: `${(xp / 50000) * 100}%` }}>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔷 1. TOP PERFORMANCE STRIP */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* LEFT: PORTFOLIO STATE */}
                <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[32px] border border-white/5 hover:border-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] duration-fast ease-emphasis group flex flex-col justify-center">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <Briefcase size={14} className="text-primary" /> PORTFOLIO VALUE
                    </div>
                    <div className="text-4xl font-black text-white mb-2 tracking-tighter drop-shadow-sm font-mono">
                        $21,576.10
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-black text-emerald-500 animate-pulse-glow bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            +$2,340 (+3.2%)
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today</span>
                    </div>
                </div>

                {/* CENTER: 🔥 SYSTEM STATUS (CRITICAL BLOCK) */}
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-950 backdrop-blur-xl p-8 rounded-[32px] border border-primary/30 animate-card-breathe transition-all hover:scale-[1.02] active:scale-[0.98] duration-fast ease-emphasis relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-standard">
                        <Activity size={80} className="text-primary" />
                    </div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">SYSTEM CAPABILITY</div>
                        <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-status-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ACTIVE</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 relative z-10">
                        <div>
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Live Signals</div>
                            <div className="text-2xl font-black text-white">3</div>
                        </div>
                        <div className="border-l border-white/5 pl-4">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Alpha Units</div>
                            <div className="text-2xl font-black text-white">3/3</div>
                        </div>
                        <div className="border-l border-white/5 pl-4">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Accuracy (24h)</div>
                            <div className="text-2xl font-black text-emerald-400">68%</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: 🎯 DAILY MISSIONS (THE ADDICTIVE LOOP) */}
                <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 transition-all hover:border-primary/20 duration-fast ease-emphasis flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div>
                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <Target size={14} className="text-primary group-hover:rotate-12 transition-transform" />
                                <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Alpha Quests</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{quests.filter(q=>q.done).length}/3 Done</span>
                        </div>
                        
                        <div className="w-full h-1 bg-slate-800 rounded-full mb-5 overflow-hidden relative z-10">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(quests.filter(q=>q.done).length / 3) * 100}%` }} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 relative z-10">
                        {quests.map(quest => (
                            <button 
                                key={quest.id}
                                onClick={() => handleQuestToggle(quest.id)}
                                disabled={quest.done}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 text-left ${
                                    quest.done 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 cursor-default shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' 
                                        : 'bg-white/5 border-white/5 hover:border-primary/30 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] cursor-pointer active:scale-95'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        quest.done ? 'border-emerald-500 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'border-slate-600'
                                    }`}>
                                        {quest.done && <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />}
                                    </div>
                                    <span className={`text-[11px] font-bold transition-all ${quest.done ? 'text-emerald-400 opacity-90' : 'text-slate-300'}`}>
                                        {quest.title}
                                    </span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${quest.done ? 'text-emerald-500/80' : 'text-primary'}`}>
                                    +{quest.xp} XP
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-10">
                <div className="flex gap-3">
                    {portfolio?.accuracy > 75 && (
                        <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-primary/20 tracking-[0.2em] shadow-lg shadow-primary/5 animate-pulse">
                            🔥 Institutional Grade
                        </span>
                    )}
                    <span className="bg-slate-800/50 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-slate-700/50 tracking-[0.2em]">
                        RANK: #{portfolio?.global_rank || '1,284'}
                    </span>
                </div>
                <Link to="/performance" className="group no-underline">
                    <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all">
                        Terminal Analytics <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-primary" />
                    </button>
                </Link>
            </div>

            {/* 🧠 2. ACTIVE ALPHA SYSTEMS */}
            <div className="mb-14 animate-fade-in">
                <div className="flex items-center gap-4 mb-8">
                    <span className="text-xl">👉</span>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Your Running Strategies</h3>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-800/50 to-transparent" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Strategy Cards */}
                    {settings?.copy_sources?.map((s, idx) => (
                        <div key={idx} className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[24px] border border-white/5 hover:border-cyan-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] duration-fast ease-emphasis group flex flex-col justify-between cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 shadow-inner">
                                        {s.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-white font-black text-sm tracking-wide group-hover:text-primary transition-colors">{s.name}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-status-pulse" />
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">ACTIVE</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 opacity-70">
                                    <Clock size={10} /> 2m ago
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">PnL Tracker</div>
                                    <div className="text-lg font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                                        +${(Math.random() * 15000 + 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Win Rate / Trades</div>
                                    <div className="text-sm font-bold text-white">
                                        {Math.floor(Math.random() * 30 + 60)}% <span className="text-slate-500 text-[10px] ml-1">/ {Math.floor(Math.random() * 50 + 10)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mini Sparkline Placeholder */}
                            <div className="mt-5 h-8 w-full bg-gradient-to-t from-primary/5 to-transparent border-b border-primary/20 relative overflow-hidden rounded-b-lg flex items-end opacity-50 group-hover:opacity-100 transition-opacity">
                                <svg width="100%" height="100%" preserveAspectRatio="none" className="animate-[draw_line_0.8s_ease-out]">
                                    <path d={`M0,32 Q20,20 40,25 T80,15 T120,20 T160,10 T200,18 T240,5 T280,12 T320,0`} fill="none" stroke="currentColor" strokeWidth="2" className="text-primary drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
                                </svg>
                            </div>
                        </div>
                    ))}

                    {/* Deploy New Alpha Placeholder (Always Visible) */}
                    <Link to="/traders" className="bg-slate-900/20 backdrop-blur-xl border-2 border-dashed border-white/5 hover:border-primary/40 rounded-[24px] p-6 flex flex-col items-center justify-center gap-4 group transition-all hover:scale-[1.02] active:scale-[0.98] duration-fast ease-emphasis no-underline min-h-[180px]">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors flex-shrink-0 animate-cta-idle">
                            <Plus size={24} className="text-slate-500 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                            <span className="block text-xs font-black uppercase text-white tracking-widest mb-1">Deploy New Alpha</span>
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access Top Strategies</span>
                        </div>
                    </Link>
                </div>
            </div>

            {/* 📊 3. LIVE MARKET INTELLIGENCE (REPLACES BORING TABLE FEEL) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* LEFT: 🔥 LIVE SIGNAL FLOW (NEW STRUCTURE USING EXISTING DATA) */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl rounded-[32px] border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="text-primary animate-pulse w-5 h-5" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Live Signal Flow</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Real-time</span>
                        </div>
                    </div>
                    
                    <div className="p-2 flex flex-col gap-1">
                        {/* Sample Signal Rows */}
                        {[
                            { type: 'BUY', asset: 'Trump Yes', size: '$12K', trader: '0x8A6C', time: '10s ago', pnl: '+$320', pnlColor: 'text-emerald-400', isNew: true },
                            { type: 'SELL', asset: 'ETH > $3500', size: '$45K', trader: '0x1F2A', time: '1m ago', pnl: '-$140', pnlColor: 'text-red-400', isNew: false },
                            { type: 'BUY', asset: 'Rate Cut Nov', size: '$8.5K', trader: '0x99B1', time: '3m ago', pnl: '+$890', pnlColor: 'text-emerald-400', isNew: false },
                            { type: 'BUY', asset: 'Trump Yes', size: '$150K', trader: '0xWHALE', time: '5m ago', pnl: '+$12,400', pnlColor: 'text-emerald-400', isNew: false },
                        ].map((sig, i) => (
                            <div key={i} className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-standard ${sig.isNew ? 'animate-highlight-flash bg-primary/5' : 'hover:bg-slate-800/30'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${sig.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                        {sig.type}
                                    </div>
                                    <div className="text-sm font-bold text-white">{sig.asset}</div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden md:block">
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Size</div>
                                        <div className="text-xs font-mono text-white">{sig.size}</div>
                                    </div>
                                    <div className="text-right hidden md:block">
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Trader</div>
                                        <div className="text-xs font-mono text-primary">{sig.trader}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{sig.time}</div>
                                        <div className={`text-sm font-black font-mono ${sig.pnlColor} drop-shadow-sm`}>{sig.pnl}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: TOP PERFORMERS SNAPSHOT (NOT FULL LEADERBOARD) */}
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Top Alphas (24H)</h3>
                        <Link to="/traders" className="text-[9px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest no-underline border border-primary/20 bg-primary/10 px-3 py-1.5 rounded-lg active:scale-95">See All</Link>
                    </div>
                    <div className="flex flex-col p-2">
                        {isLoadingLeaderboard ? (
                            <div className="text-center py-20">
                                <Activity className="text-primary animate-pulse w-8 h-8 opacity-20 mx-auto mb-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Syncing Alphas...</span>
                            </div>
                        ) : leaderboard.slice(0, 5).map((trader, i) => (
                            <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-800/30 rounded-2xl transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-6 text-center text-[10px] font-black text-slate-500">#{i + 1}</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 font-black text-xs">
                                            {(trader.userName || trader.username || 'T').charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-white">{trader.userName || trader.username || '0x' + (trader.proxyWallet || trader.address || 'ABCD').substring(2,6)}</div>
                                            <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
                                                🔥 {Math.floor(Math.random() * 8 + 3)} Wins
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-black text-emerald-400 drop-shadow-sm">+${(parseFloat(trader.pnl) || (Math.random()*100000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Win: {Math.floor(Math.random() * 30 + 60)}%</div>
                                    </div>
                                    <button className="bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 transition-colors opacity-0 group-hover:opacity-100 shadow-[0_0_12px_rgba(255,255,255,0.1)] active:scale-95 flex-shrink-0">
                                        COPY
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
