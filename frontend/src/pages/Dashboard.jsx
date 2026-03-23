import React, { useState, useEffect, useContext } from 'react';
import { PortfolioContext } from '../context/PortfolioContext';
import { AuthContext } from '../context/AuthContext';
import { TrendingUp, Activity, DollarSign, ArrowUpRight, ArrowDownRight, UserPlus, Target, Plus, Zap, Briefcase, Clock, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { portfolio, settings, strategies, addSource, refreshStrategies } = useContext(PortfolioContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
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
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        // Fetch daily leaderboard (Public info)
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
    }, []); // Only run once on mount since this is a public preview block

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

    const handleMirror = async (trader) => {
        if (!user) { alert("Please login to scale profits."); return; }
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const userId = user.user_id || user.userId;
            const res = await fetch(`${apiUrl}/api/strategies/mirror?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    address: trader.proxyWallet || trader.address || '0x0000000000000000000000000000000000000000', 
                    username: trader.userName || trader.username || 'Anonymous Whale', 
                    risk_mode: 'Balanced' 
                })
            });
            
            if (res.status === 403) {
                setNotification({ 
                    type: 'error', 
                    message: "You've reached your follow limit! Upgrade your plan to scale this alpha.",
                    isLimitError: true 
                });
                return;
            }
            
            if (res.ok) {
                if (refreshStrategies) await refreshStrategies();
                navigate('/simulator');
            }
        } catch (err) {
            console.error(err);
        }
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
                        <Link
                            to="/subscription"
                            onClick={(e) => { e.stopPropagation(); setNotification(null); }}
                            className="bg-white text-slate-900 px-3 py-1 rounded text-xs font-bold whitespace-nowrap no-underline hover:bg-slate-100 transition-colors"
                        >
                            Upgrade Plan
                        </Link>
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
                        Commander <span className="text-primary">{user?.username || user?.user_name || 'Anonymous'}</span>
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
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 md:mt-0 bg-slate-900/60 border border-white/10 rounded-2xl px-5 py-4 flex flex-col items-center justify-center backdrop-blur-md shadow-2xl relative overflow-hidden group min-w-[200px] opacity-70">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Target size={10} className="text-primary" /> Current Tier
                    </div>
                    <div className="text-sm font-black text-white uppercase tracking-widest tabular-nums border border-white/10 bg-white/5 px-4 py-1.5 rounded-lg mt-1">
                        Coming Soon
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
                        ${(portfolio?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`text-sm font-black animate-pulse-glow px-3 py-1 rounded-full border ${(portfolio?.total_pnl || 0) >= 0 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-500 bg-rose-500/10 border-rose-500/20'}`}>
                            {(portfolio?.total_pnl || 0) >= 0 ? '+' : ''}${(portfolio?.total_pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lifetime</span>
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
                            <div className="text-2xl font-black text-white">{signals.length || 0}</div>
                        </div>
                        <div className="border-l border-white/5 pl-4">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Alpha Units</div>
                            <div className="text-2xl font-black text-white">{strategies?.filter(s => s.status === 'active').length || 0}/{strategies?.length || 0}</div>
                        </div>
                        <div className="border-l border-white/5 pl-4">
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Accuracy</div>
                            <div className="text-2xl font-black text-primary">{((portfolio?.accuracy || 0) * 100).toFixed(0)}%</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: 🎯 DAILY MISSIONS (THE ADDICTIVE LOOP) */}
                <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 transition-all flex flex-col justify-center items-center group relative overflow-hidden opacity-50">
                    <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <Target size={32} className="text-slate-600 mb-4" />
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-1">Alpha Quests</h3>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] border border-white/10 px-4 py-1.5 rounded-lg mt-2 inline-block">Coming Soon</span>
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
                        RANK: #{portfolio?.global_rank || Math.max(1, 10000 - Math.floor(portfolio?.total_pnl || 0))} / {10000 + Math.floor(leaderboard.length * 14.3)} USERS
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
                    {strategies?.map((s, idx) => (
                        <div key={idx} className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[24px] border border-white/5 hover:border-cyan-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] duration-fast ease-emphasis group flex flex-col justify-between cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 shadow-inner">
                                        {(s.name || '').charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-white font-black text-sm tracking-wide group-hover:text-primary transition-colors">{s.name}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${(s.status || 'inactive') === 'active' ? 'bg-emerald-500 animate-status-pulse' : 'bg-slate-500'}`} />
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${(s.status || 'inactive') === 'active' ? 'text-emerald-500' : 'text-slate-500'}`}>{s.status?.toUpperCase() || 'INACTIVE'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 opacity-70">
                                    <Clock size={10} /> Active
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Simulated PnL</div>
                                    <div className={`text-lg font-black ${s.simulated_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'} drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]`}>
                                        {s.simulated_pnl >= 0 ? '+' : ''}${parseFloat(s.simulated_pnl || 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Allocation</div>
                                    <div className="text-sm font-bold text-white">
                                        {s.allocation_percentage}%
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
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl rounded-[32px] border border-white/5 transition-all flex flex-col justify-center items-center p-12 group relative overflow-hidden opacity-50">
                    <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <Activity size={32} className="text-slate-600 mb-4" />
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-1">Live Signal Flow</h3>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] border border-white/10 px-4 py-1.5 rounded-lg mt-2 inline-block">Coming Soon</span>
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
                        ) : leaderboard.slice(0, 5).map((trader, i) => {
                            const address = trader.proxyWallet || trader.address;
                            const isFollowing = settings?.copy_sources?.some(s => s.address === address);
                            const isFull = (settings?.copy_sources?.length || 0) >= (settings?.source_slots || 10);

                            return (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-800/30 rounded-2xl transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-6 text-center text-[10px] font-black text-slate-500">#{i + 1}</div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 font-black text-xs">
                                                {(trader.userName || trader.username || 'T').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-white">{trader.userName || trader.username || '0x' + (trader.proxyWallet || trader.address || 'ABCD').substring(2,6)}</div>
                                                <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
                                                    🔥 {trader.win_streak || 0} Wins
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-sm font-black text-emerald-400 drop-shadow-sm">+${(parseFloat(trader.pnl || trader.volume * (trader.roi||0)/100 || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Win: {((trader.win_rate || 0) * 100).toFixed(0)}%</div>
                                        </div>
                                        <button 
                                            onClick={() => handleMirror(trader)}
                                            className={`font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all opacity-0 group-hover:opacity-100 shadow-lg active:scale-95 flex-shrink-0 ${
                                                isFull && !isFollowing 
                                                    ? 'bg-amber-500 text-white border-amber-600' 
                                                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            {isFull && !isFollowing ? 'UPGRADE' : (isFollowing ? 'ACTIVE' : 'SCALE')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
