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

            {/* Top Stats Row - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/50 hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 group-hover:bg-primary/10 transition-colors">
                            <Briefcase className="text-primary w-5 h-5" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">LIVE VECTOR</div>
                    </div>
                    <div className="text-3xl font-black text-white mb-1 group-hover:text-primary transition-colors">
                        {loading ? '---' : (portfolio?.wallet_address?.substring(0, 8) || user?.user_id?.substring(0, 8) || '0x00...')}...
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Linked Portfolio</div>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/50 hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/10 transition-colors">
                            <TrendingUp className="text-emerald-500 w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-emerald-500 uppercase">+{portfolio?.roi || 0}% ROI</span>
                        </div>
                    </div>
                    <div className="text-3xl font-black text-emerald-500 mb-1">
                        ${(portfolio?.total_pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Simulation PnL</div>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/50 hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 group-hover:bg-primary/10 transition-colors">
                            <Target className="text-primary w-5 h-5" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none text-right">ACCURACY</div>
                    </div>
                    <div className="text-3xl font-black text-white mb-1 text-right">
                        {portfolio?.accuracy || 0}%
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none text-right">{portfolio?.total_resolved || 0} RECONCILIATIONS</div>
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

            {/* Deployed Alpha Units */}
            {settings?.copy_sources?.length > 0 && (
                <div className="mb-14 animate-fade-in">
                    <div className="flex items-center gap-4 mb-8">
                        <Activity size={18} className="text-primary animate-pulse" />
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Deployed Alpha Units</h3>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-800/50 to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {settings.copy_sources.slice(0, 4).map((s, idx) => (
                            <div key={idx} className="bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl border border-slate-800/50 hover:border-primary/30 transition-all cursor-pointer group hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg font-black shadow-inner">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-white uppercase tracking-wider mb-0.5">{s.name}</div>
                                            <div className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">{s.platform}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <ArrowUpRight size={16} className="text-slate-600 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                                    <span>STATUS: DEPLOYED</span>
                                    <span className="text-emerald-500/60">ACTIVE</span>
                                </div>
                            </div>
                        ))}
                        <Link to="/traders" className="bg-slate-900/20 border-2 border-dashed border-slate-800/50 hover:border-primary/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 group transition-all no-underline">
                            <Plus size={28} className="text-slate-700 group-hover:text-primary transition-all group-hover:scale-110" />
                            <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-primary tracking-widest">Deploy Alpha</span>
                        </Link>
                    </div>
                </div>
            )}

            <div>
                <div className="flex flex-col gap-8">
                    {/* Tab Navigation */}
                    <div className="flex gap-8 border-b border-slate-800/50 pb-0">
                        {['Polymarket', 'Kalshi', 'Manifold', 'Signals'].map(tab => {
                            const isAvailable = tab === 'Polymarket' || tab === 'Signals';
                            return (
                                <button
                                    key={tab}
                                    onClick={() => isAvailable && setActiveTab(tab)}
                                    className={`pb-4 px-1 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${
                                        activeTab === tab ? 'text-primary' : 'text-slate-600 hover:text-slate-400'
                                    } ${!isAvailable ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    {tab} {!isAvailable && '(Soon)'}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {activeTab === 'Polymarket' && (
                        <section className="animate-fade-in group">
                            <div className="flex justify-between items-center mb-8">
                                <a 
                                    href="https://polymarket.com/leaderboard/overall/today/profit" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="no-underline group/link"
                                >
                                    <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-slate-400 group-hover/link:text-primary transition-colors">
                                        <TrendingUp size={18} className="text-primary animate-pulse" /> 
                                        Intraday Alpha Orderbook 
                                        <ArrowUpRight size={14} className="opacity-0 group-hover/link:opacity-100 transition-all translate-y-1 group-hover/link:translate-y-0" />
                                    </h3>
                                </a>
                                <div className="bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800/50 flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Alpha Slots:</span>
                                    <span className={`text-xs font-black ${
                                        (settings?.copy_sources?.length || 0) >= (settings?.source_slots || 0) ? 'text-red-500' : 'text-emerald-500'
                                    }`}>
                                        {settings?.copy_sources?.length || 0} / {settings?.source_slots || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-900/20 rounded-2xl border border-slate-800/50 overflow-hidden backdrop-blur-sm">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900/40 border-b border-slate-800/50">
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-20">Rank</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Institution / Identity</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Alpha Vector</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Intraday PnL</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-48">Command</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingLeaderboard ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-20">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <Activity className="text-primary animate-pulse w-8 h-8 opacity-20" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Syncing Alpha Vectors...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : leaderboard.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-20 italic text-[10px] font-black uppercase tracking-widest text-slate-700">No Vectors Detected</td>
                                            </tr>
                                        ) : leaderboard.map((trader, idx) => {
                                            const isFollowing = settings?.copy_sources?.some(s => s.address?.toLowerCase() === trader.proxyWallet?.toLowerCase());
                                            const slotsFull = (settings?.copy_sources?.length || 0) >= (settings?.source_slots || 0);
                                            
                                            return (
                                                <tr key={idx} className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors group/row">
                                                    <td className="px-6 py-5 text-[11px] font-black text-slate-700 group-hover/row:text-slate-500 transition-colors tabular-nums">
                                                        #{idx + 1}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            {trader.profileImage || trader.profile_image ? (
                                                                <div className="relative">
                                                                    <img src={trader.profileImage || trader.profile_image} alt="" className="w-10 h-10 rounded-xl border border-slate-800 shadow-2xl transition-transform group-hover/row:scale-105" />
                                                                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-sm font-black transition-transform group-hover/row:scale-105">
                                                                    {(trader.userName || trader.username || 'T').charAt(0)}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="text-[11px] font-black text-white uppercase tracking-wider mb-0.5">{trader.userName || trader.username || 'Unknown Whale'}</div>
                                                                <div className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest">VERIFIED ALPHA</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <a
                                                            href={`https://polymarket.com/profile/${trader.proxyWallet || trader.address}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] font-mono text-slate-500 hover:text-primary transition-all flex items-center gap-2 group/addr no-underline"
                                                        >
                                                            {(trader.proxyWallet || trader.address || "").substring(0, 8)}...{(trader.proxyWallet || trader.address || "").substring(36)}
                                                            <ArrowUpRight size={12} className="opacity-0 group-hover/addr:opacity-100 transition-opacity" />
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <div className="text-xs font-black text-emerald-400 tracking-tighter tabular-nums drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]">
                                                            +${parseFloat(trader.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </div>
                                                        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">REALIZED PROFITS</div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <button
                                                            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                                                                isFollowing 
                                                                    ? 'bg-primary/10 border-primary/20 text-primary cursor-default' 
                                                                    : (slotsFull 
                                                                        ? 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed' 
                                                                        : 'bg-primary border-primary text-white hover:bg-transparent hover:text-primary transition-all shadow-lg shadow-primary/20')
                                                            }`}
                                                            onClick={() => !isFollowing && !slotsFull && handleFollow(trader)}
                                                            disabled={isFollowing || slotsFull}
                                                        >
                                                            {isFollowing ? 'DEPLOYED' : (slotsFull ? 'CAPACITY REACHED' : 'SCALE ALPHA')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-8 p-6 bg-slate-900/40 rounded-2xl border border-slate-800/50 border-dashed">
                                <p className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase tracking-[0.1em] m-0 flex items-start gap-4">
                                    <span className="text-primary font-black whitespace-nowrap px-2 py-0.5 bg-primary/10 rounded border border-primary/20">TERMINAL LOG</span>
                                    <span>
                                        Leaderboard rankings are derived from real-time Polymarket consensus and historical alpha correlation. 
                                        PnL figures are calculated using official realized settlements. Unrealized variance may apply to open vectors.
                                    </span>
                                </p>
                            </div>
                        </section>
                    )}

                    {activeTab === 'Signals' && (
                        <div className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] min-h-[450px] p-12 border-2 border-dashed border-slate-800/50 flex flex-col items-center justify-center text-center animate-fade-in">
                            <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mb-8 border border-slate-700 group hover:border-primary/40 transition-all">
                                <Activity size={32} className="text-slate-600 group-hover:text-primary transition-colors opacity-30 group-hover:opacity-100" />
                            </div>
                            <h4 className="text-lg font-black text-white uppercase tracking-[0.3em] mb-4">Coming Soon</h4>
                            <p className="text-slate-500 max-w-md text-xs font-medium leading-relaxed uppercase tracking-widest">
                                Real-time AI-driven consensus signals and market sentiment analysis are currently under beta testing.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
