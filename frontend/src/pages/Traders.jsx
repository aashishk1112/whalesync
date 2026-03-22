import React, { useState, useEffect, useRef } from 'react';
import { Award, TrendingUp, Target, Shield, Clock, ExternalLink, ChevronDown, ChevronUp, Zap, Activity, AlertCircle, Sparkles, TrendingDown, ArrowUpRight, ArrowDownRight, Info, Flame, History, DollarSign, Users, Eye, Play, BarChart3, Timer } from 'lucide-react';
import Sparkline from '../components/Sparkline';
import RiskMeter from '../components/RiskMeter';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { PortfolioContext } from '../context/PortfolioContext';

function UpgradeModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in px-4">
            <div className="bg-slate-900 border border-white/10 max-w-md w-full p-10 rounded-[32px] text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                <div className="flex justify-center mb-8">
                    <div className="p-5 rounded-3xl bg-primary/10 border border-primary/20">
                        <Sparkles size={48} className="text-primary animate-pulse" />
                    </div>
                </div>
                <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter text-white">Capacity Warning</h3>
                <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">
                    You've reached the maximum number of active mirror strategies for your current plan. Upgrade to <span className="text-primary font-bold">Terminal Pro</span> for unlimited source slots and institutional-grade alpha.
                </p>
                <div className="flex flex-col gap-4">
                    <button 
                        onClick={() => window.location.href = '/subscriptions'}
                        className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl hover:bg-transparent hover:text-primary border border-primary transition-all shadow-xl shadow-primary/20"
                    >
                        Unlock Pro Access
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-2 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
}

// 🚀 High-Conversion Component: Live Alpha Alert Bar
const OpportunityStrip = () => {
    const opportunities = [
        { label: "US Election Whale Activity", amount: "$124,500", time: "2m left", type: "CRITICAL" },
        { label: "Crypto Sentiment Spike", amount: "+$4.2k Potential", time: "8m left", type: "HOT" },
        { label: "OracleWhale just entered YES", amount: "$18,000", time: "Just now", type: "WHALE" },
        { label: "New Alpha Signal: BTC ETF", amount: "94% Conf", time: "15m left", type: "SIGNAL" }
    ];

    return (
        <div className="relative mb-10 h-12 rounded-2xl border border-primary/30 bg-primary/5 shadow-inner overflow-hidden flex items-center">
            <div className="absolute left-0 z-20 h-full flex items-center px-6 bg-primary text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl">
                LIVE ALPHA
            </div>
            <div className="flex gap-16 py-2 animate-marquee whitespace-nowrap pl-40">
                {[...opportunities, ...opportunities, ...opportunities].map((op, i) => (
                    <div key={i} className="flex items-center gap-6 border-r border-white/10 pr-16 h-8">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                            op.type === 'CRITICAL' ? 'bg-red-500/10 border-red-500 text-red-500' : 
                            op.type === 'HOT' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 
                            'bg-primary/10 border-primary text-primary'
                        }`}>
                            {op.type}
                        </span>
                        <span className="text-[11px] font-bold text-white uppercase tracking-tight">{op.label}</span>
                        <span className="text-[11px] font-black text-emerald-400 tabular-nums">{op.amount}</span>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Clock size={12} className="opacity-50" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{op.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 🐳 Addictive Component: Whale Activity Live Feed
const WhaleActivityFeed = () => {
    const feeds = [
        { user: "OracleWhale", action: "COPIED", target: "Polymarket", amount: "$4,200", time: "2s" },
        { user: "KalshiKing", action: "CASHED OUT", target: "Kalshi", amount: "$12,400", time: "15s" },
        { user: "PredictionBot", action: "ENTERED", target: "Polymarket", amount: "$800", time: "45s" }
    ];

    return (
        <div className="hidden lg:flex flex-col gap-4 p-6 bg-slate-900/20 backdrop-blur-md rounded-2xl border border-slate-800/50 sticky top-24 h-fit max-w-[240px]">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <Activity size={12} className="text-primary" /> LIVE WHALE FEED
            </h4>
            <div className="space-y-4">
                {feeds.map((f, i) => (
                    <div key={i} className="animate-fade-in group/item">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] font-black text-white truncate pr-2">@{f.user}</span>
                            <span className="text-[9px] font-bold text-slate-600 tabular-nums">{f.time} ago</span>
                        </div>
                        <div className="text-[10px] font-black">
                            <span className={f.action === 'CASHED OUT' ? 'text-emerald-400' : 'text-primary'}>{f.action} </span>
                            <span className="text-white font-mono">{f.amount}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">{f.target}</div>
                        {i !== feeds.length - 1 && <div className="h-[1px] bg-slate-800/50 mt-4" />}
                    </div>
                ))}
            </div>
            <button className="mt-4 py-2 text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors border-t border-slate-800 pt-4">View All Signals →</button>
        </div>
    );
};

const TraderRow = ({ trader, idx, formatCurrency, onMirror, isPro, isSelected, onSelect }) => {
    // Derived/Simulated Metrics
    const movement = trader.rank_movement || (idx % 2 === 0 ? 2 : -1);
    const winStreak = trader.win_streak || (idx === 0 ? 8 : idx === 1 ? 5 : 3);
    const maxDrawdown = trader.max_drawdown || 4.2 + (idx * 0.5);
    const realizedProfit = (trader.volume || 10000) * (trader.roi || 0.1) / 100;

    return (
        <tr 
            className={`border-b border-slate-800/30 hover:bg-slate-800/20 transition-all cursor-pointer group/row ${
                isSelected ? 'bg-primary/5 border-primary/20' : ''
            }`}
            onClick={() => onSelect(trader)}
        >
            {/* RANK COLUMN */}
            <td className="py-5 px-6">
                <div className="flex items-center gap-4">
                    <span className="text-[11px] font-black text-slate-700 w-6 tabular-nums">{trader.rank || idx + 1}</span>
                    <div className={`flex items-center gap-1 ${movement > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {movement > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        <span className="text-[10px] font-black tabular-nums">{Math.abs(movement)}</span>
                    </div>
                </div>
            </td>

            {/* TRADER COLUMN */}
            <td className="py-5 px-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        {trader.profile_image ? (
                            <img src={trader.profile_image} alt="" className="w-10 h-10 rounded-xl border border-slate-800 shadow-xl transition-transform group-hover/row:scale-105" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[11px] font-black border border-slate-700 text-slate-400 uppercase transition-transform group-hover/row:scale-105">
                                {trader.username ? trader.username[0] : 'W'}
                            </div>
                        )}
                        {winStreak >= 5 && (
                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-lg flex items-center justify-center border-2 border-slate-950 shadow-lg shadow-orange-500/20">
                                <Flame size={10} fill="currentColor" className="text-white" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-[11px] font-black text-white flex items-center gap-2 uppercase tracking-wide">
                            {trader.username || 'Anonymous Whale'}
                            {idx < 3 && <Shield size={10} className="text-primary" />}
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                            {trader.address ? `${trader.address.slice(0, 8)}...${trader.address.slice(-4)}` : 'INSTITUTIONAL'}
                        </div>
                    </div>
                </div>
            </td>

            {/* PERFORMANCE COLUMN (Real Money) */}
            <td className="py-5 px-6">
                <div className="flex flex-col">
                    <span className="text-emerald-400 text-xs font-black tracking-tight tabular-nums drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]">
                        {formatCurrency(realizedProfit)}
                    </span>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mt-1">REALIZED ALPHA</span>
                </div>
            </td>

            {/* TRUST COLUMN */}
            <td className="py-5 px-6">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-white text-[11px] font-black tabular-nums">{(trader.win_rate * 100).toFixed(0)}%</span>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">WIN RATE</span>
                    </div>
                    <div className="flex flex-col border-l border-slate-800 pl-6">
                        <span className="text-red-400 text-[11px] font-black tabular-nums">-{maxDrawdown.toFixed(1)}%</span>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">MAX DD</span>
                    </div>
                </div>
            </td>

            {/* MOMENTUM COLUMN */}
            <td className="py-5 px-6">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-primary text-[11px] font-black tabular-nums">{Math.floor(Math.random() * 50) + 12}</span>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">FOLLOWS</span>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-800 mx-2" />
                    <Sparkline data={[10, 15, 8, 20, 25, 18, 30]} width={50} height={16} />
                </div>
            </td>

            {/* ACTION COLUMN */}
            <td className="py-5 px-6 text-right">
                <button 
                    onClick={(e) => { e.stopPropagation(); onMirror(trader); }}
                    className="px-5 py-2.5 bg-primary text-white border border-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-transparent hover:text-primary transition-all shadow-lg shadow-primary/20"
                >
                    SCALE ALPHA
                </button>
            </td>
        </tr>
    );
};

// 🏛️ Institutional Action Panel (Sticky Right Column)
const ActionPanel = ({ trader, formatCurrency, onMirror }) => {
    const [activeTab, setActiveTab] = useState('DNA');
    const [simAmount, setSimAmount] = useState(1000);
    
    if (!trader) return (
        <div className="bg-slate-900/40 backdrop-blur-xl border-2 border-dashed border-slate-800/50 flex items-center justify-center p-12 text-center rounded-[32px] min-h-[500px]">
            <div className="space-y-6">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl mx-auto flex items-center justify-center border border-slate-700">
                    <Users size={24} className="text-slate-600 opacity-40 shrink-0" />
                </div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] leading-relaxed max-w-[200px] mx-auto">
                    Select a whale node to initiate terminal analysis
                </p>
            </div>
        </div>
    );

    const simReturn = (simAmount * (trader.roi || 5)) / 100;
    const confidence = trader.whale_score ? Math.min(99, Math.round(trader.whale_score)) : 85;

    return (
        <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[32px] border border-primary/20 overflow-hidden flex flex-col shadow-2xl animate-fade-in relative">
            <div className="absolute top-0 right-0 p-4">
                <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-500 tracking-widest uppercase">
                    ACTIVE NODE
                </div>
            </div>

            {/* Header: Identity */}
            <div className="p-8 border-b border-slate-800/50">
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {trader.profile_image ? (
                            <img src={trader.profile_image} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <Award size={28} className="text-primary opacity-50" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tighter leading-none mb-1.5 uppercase">{trader.username || 'Anonymous Whale'}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px] lowercase">{trader.address}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                        <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Alpha Score</span>
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-primary" />
                            <span className="text-lg font-black text-white tabular-nums">{Math.round(trader.whale_score || 0)}</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                        <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Win Streak</span>
                        <div className="flex items-center gap-2">
                            <Flame size={14} className="text-orange-500" />
                            <span className="text-lg font-black text-white tabular-nums">{trader.win_streak || 5}W</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content: Tabs */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {/* Tab Switcher */}
                <div className="flex gap-1 bg-slate-950/50 p-1 rounded-xl mb-8 border border-white/5">
                    {['DNA', 'SIM', 'INTEL'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="animate-fade-in min-h-[250px]">
                    {activeTab === 'DNA' && (
                        <div className="space-y-6">
                            <div className="p-5 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-4">Core Strategy Profile</span>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight">Trading Vector</span>
                                        <span className="text-white font-black uppercase">Macro Sniper</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight">Focus Market</span>
                                        <span className="text-primary font-black uppercase">Polymarket Alpha</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight">Holding Time</span>
                                        <span className="text-white font-black uppercase">4.2H (Avg)</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-center">
                                        <span className="text-[9px] font-black text-slate-600 uppercase block mb-1 tracking-widest">Self Accuracy</span>
                                        <span className="text-xl font-black text-slate-700">0%</span>
                                    </div>
                                    <div className="w-12 h-[1px] bg-slate-800" />
                                    <div className="text-center">
                                        <span className="text-[9px] font-black text-primary uppercase block mb-1 tracking-widest">Whale Gap</span>
                                        <span className="text-xl font-black text-primary">+{(trader.win_rate * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic text-center px-4">
                                    "Systematic mirror of this node eliminates 44% of variance in Political markets."
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SIM' && (
                        <div className="space-y-8">
                            <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                                <div className="flex justify-between items-end mb-6">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Allocation</span>
                                    <span className="text-3xl font-black text-white tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                                        {formatCurrency(simAmount)}
                                    </span>
                                </div>
                                <input 
                                    type="range" min="100" max="10000" step="100" value={simAmount}
                                    onChange={(e) => setSimAmount(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-900 rounded-full accent-primary cursor-pointer mb-8"
                                />
                                <div className="p-5 bg-primary/10 rounded-2xl border border-primary/20 flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Estimated 7d PnL</span>
                                    <span className="text-3xl font-black text-white tabular-nums">+{formatCurrency(simReturn)}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                                    <span className="text-[9px] font-black text-emerald-500 uppercase block mb-1 leading-none">Max Alpha</span>
                                    <span className="text-sm font-black text-white tabular-nums">+{formatCurrency(simReturn * 1.5)}</span>
                                </div>
                                <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
                                    <span className="text-[9px] font-black text-red-400 uppercase block mb-1 leading-none">Stress DD</span>
                                    <span className="text-sm font-black text-white tabular-nums">-{formatCurrency(simReturn * 0.4)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'INTEL' && (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(t => (
                                <div key={t} className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800/50 border-l-4 border-l-primary group/signal hover:bg-slate-800/60 transition-all">
                                    <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase mb-2 tracking-widest">
                                        <span>TXN-{892 + t}</span>
                                        <span className="flex items-center gap-1"><Clock size={10} /> {t}m ago</span>
                                    </div>
                                    <div className="text-xs font-bold text-white leading-relaxed">
                                        Deployed <span className="text-emerald-400">$2.4k</span> vector on <span className="text-primary italic">Market #92</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer: Multi-line CTA */}
            <div className="p-8 bg-slate-950/50 border-t border-slate-800/50">
                <button 
                    onClick={() => onMirror(trader)}
                    className="w-full relative group/btn overflow-hidden rounded-[24px] border border-primary/50 shadow-2xl transition-all"
                >
                    <div className="absolute inset-0 bg-primary group-hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
                    <div className="relative py-6 flex flex-col gap-1.5 items-center">
                        <div className="flex items-center gap-3">
                            <Zap size={16} className="text-white fill-white animate-pulse" />
                            <span className="text-[14px] font-black text-white uppercase tracking-[0.25em]">SCALE ALPHA VECTOR</span>
                        </div>
                        <div className="flex items-center gap-5 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                            <span className="tabular-nums">Est: +{formatCurrency((simAmount || 1000) * 0.15)}/wk</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> {confidence}% Conf</span>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
};


const Leaderboard = () => {
    const { user } = React.useContext(AuthContext);
    const { refreshStrategies } = React.useContext(PortfolioContext);
    const navigate = useNavigate();
    const [traders, setTraders] = useState([]);
    const [archetypes, setArchetypes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [archLoading, setArchLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('WEEK');
    const [sortBy, setSortBy] = useState('SCORE');
    const [isPro, setIsPro] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [selectedTrader, setSelectedTrader] = useState(null);
    const [mirroringStatus, setMirroringStatus] = useState(null);

    // Selection Logic: Auto-select first trader when data loads
    useEffect(() => {
        if (traders.length > 0 && !selectedTrader) {
            setSelectedTrader(traders[0]);
        }
    }, [traders, selectedTrader]);

    const handleMirror = async (trader) => {
        if (!user) { alert("Please login to scale profits."); return; }
        setMirroringStatus('Initializing System...');
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/strategies/mirror?user_id=${user.user_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: trader.address, username: trader.username || 'Anonymous', risk_mode: 'Balanced' })
            });
            if (res.status === 403) { setIsUpgradeModalOpen(true); setMirroringStatus(null); return; }
            
            // Refresh strategies in context so Dashboard/Simulator are up to date
            if (refreshStrategies) await refreshStrategies();
            
            setMirroringStatus('System Active!');
            setTimeout(() => { navigate('/simulator'); }, 800);
        } catch (err) { setMirroringStatus(null); }
    };

    useEffect(() => {
        const fetchArchetypes = async () => {
            setArchLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/traders/archetypes`);
                if (res.ok) {
                    const data = await res.json();
                    setArchetypes(data.archetypes);
                }
            } catch (err) { console.error(err); } finally { setArchLoading(false); }
        };
        fetchArchetypes();
    }, []);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/traders/leaderboard?timeframe=${timeframe}&sort_by=${sortBy}`);
                if (res.ok) {
                    const data = await res.json();
                    setTraders(data.traders || []);
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchLeaderboard();
    }, [timeframe, sortBy]);

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="w-full animate-fade-in relative z-10 pb-20">
            {/* 🎲 Opportunity Strip (FOMO) */}
            <OpportunityStrip />

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-10 items-start">
                {/* 🐳 Main Leaderboard (Left Column) */}
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/50 pb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Terminal • {traders.length} Nodes Active</span>
                            </div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                                Alpha <span className="text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">Orderbook</span>
                            </h1>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6">
                            {/* Mode Toggle */}
                            <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/50 shadow-inner">
                                <button onClick={() => setIsPro(false)} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isPro ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}>Simple</button>
                                <button onClick={() => setIsPro(true)} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isPro ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'text-slate-600 hover:text-slate-400'}`}>Pro</button>
                            </div>

                            {/* Timeframe Select */}
                            <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/50 shadow-inner">
                                {['DAY', 'WEEK', 'ALL'].map(tf => (
                                    <button 
                                        key={tf} 
                                        className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${timeframe === tf ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`} 
                                        onClick={() => setTimeframe(tf)}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/20 rounded-[32px] border border-slate-800/50 overflow-hidden backdrop-blur-sm shadow-2xl">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-950/40 border-b border-slate-800/50">
                                    <th className="py-5 px-6 text-left text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] w-24">Rank</th>
                                    <th className="py-5 px-6 text-left text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Institution / Identity</th>
                                    <th className="py-5 px-6 text-left text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Performance</th>
                                    <th className="py-5 px-6 text-left text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Trust Matrix</th>
                                    <th className="py-5 px-6 text-left text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Momentum</th>
                                    <th className="py-5 px-6 text-right text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] w-48">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-32">
                                            <div className="flex flex-col items-center gap-6">
                                                <Activity className="text-primary animate-pulse w-10 h-10 opacity-30" />
                                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">Synchronizing Liquidity Pools...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    traders.map((trader, idx) => (
                                        <TraderRow 
                                            key={trader.address || idx} 
                                            trader={trader} 
                                            idx={idx} 
                                            formatCurrency={formatCurrency} 
                                            onMirror={handleMirror} 
                                            isPro={isPro}
                                            isSelected={selectedTrader?.address === trader.address}
                                            onSelect={setSelectedTrader}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 📊 Right Column: Sticky Action Panel */}
                <div className="flex flex-col gap-10 sticky top-10">
                    <ActionPanel 
                        trader={selectedTrader} 
                        formatCurrency={formatCurrency} 
                        onMirror={handleMirror} 
                    />
                    
                    {/* Secondary Nudge Widget */}
                    <div className="p-8 bg-primary/5 rounded-[32px] border border-primary/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles size={40} className="text-primary" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <Activity size={16} className="text-primary" />
                            <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">AI Intelligence</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">
                             "Whale @Oracle's momentum spike in US Politics matches your risk profile. 92% historical alpha correlation in this market detected."
                        </p>
                    </div>

                    {/* Live Whale Activity Feed Integration */}
                    <WhaleActivityFeed />
                </div>
            </div>

            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        </div>
    );
};

export default Leaderboard;
