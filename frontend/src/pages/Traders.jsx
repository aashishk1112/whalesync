import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
    Award, TrendingUp, Target, Shield, Clock, ExternalLink, 
    ChevronDown, ChevronUp, Zap, Activity, AlertCircle, 
    Sparkles, TrendingDown, ArrowUpRight, ArrowDownRight, 
    Info, Flame, History, DollarSign, Users, Eye, Play, 
    BarChart3, Timer, CheckCircle2, XCircle, ChevronRight,
    Star, Search, Filter, Hash, MousePointer2
} from 'lucide-react';
import Sparkline from '../components/Sparkline';
import RiskMeter from '../components/RiskMeter';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { PortfolioContext } from '../context/PortfolioContext';

// 🎨 DESIGN SYSTEM OVERRIDE (Terminal Aesthetic)
const DesignSystemStyles = () => (
    <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Satoshi:wght@400;700;900&display=swap');

        :root {
            --term-bg: #061018;
            --term-primary: #00FFC6;
            --term-secondary: #00A3FF;
            --term-accent: #FF7A00;
            --term-success: #00FF9C;
            --term-warning: #FFC857;
            --term-danger: #FF4D4D;
            --term-glass: rgba(10, 25, 41, 0.7);
            --term-glass-border: rgba(0, 255, 198, 0.15);
            --term-glow-primary: 0 0 20px rgba(0, 255, 198, 0.3);
            --font-terminal: 'Satoshi', 'Inter', system-ui, sans-serif;
        }

        .term-font { font-family: var(--font-terminal); }
        
        .glass-panel-heavy {
            background: var(--term-glass);
            backdrop-filter: blur(40px) saturate(180%);
            -webkit-backdrop-filter: blur(40px) saturate(180%);
            border: 1px solid var(--term-glass-border);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .neon-glow-cyan { text-shadow: 0 0 10px rgba(0, 255, 198, 0.5); color: var(--term-primary); }
        .neon-glow-blue { text-shadow: 0 0 10px rgba(0, 163, 255, 0.5); color: var(--term-secondary); }
        .neon-glow-orange { text-shadow: 0 0 10px rgba(255, 122, 0, 0.5); color: var(--term-accent); }

        .btn-neon {
            background: linear-gradient(135deg, var(--term-primary), var(--term-secondary));
            box-shadow: 0 0 15px rgba(0, 255, 198, 0.2);
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .btn-neon:hover {
            transform: scale(1.05) translateY(-2px);
            box-shadow: 0 0 30px rgba(0, 255, 198, 0.5);
        }

        .score-pulse { animation: score-breathing 3s ease-in-out infinite; }
        @keyframes score-breathing {
            0%, 100% { filter: brightness(1) drop-shadow(0 0 5px rgba(0, 255, 198, 0.2)); }
            50% { filter: brightness(1.2) drop-shadow(0 0 15px rgba(0, 255, 198, 0.6)); }
        }

        .row-hover-effect {
            transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .row-hover-effect:hover {
            background: rgba(0, 255, 198, 0.03);
            border-color: rgba(0, 255, 198, 0.3);
            transform: scale(1.002) translateY(-2px);
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
        }

        .sparkline-animate path {
            stroke-dasharray: 200;
            stroke-dashoffset: 200;
            animation: draw-spark 1.5s ease-out forwards;
        }
        @keyframes draw-spark { to { stroke-dashoffset: 0; } }

        .risk-bar {
            height: 4px;
            background: rgba(255,255,255,0.05);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
        }
        .risk-bar-fill { height: 100%; transition: width 1s ease-out; }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 198, 0.2); border-radius: 2px; }
    `}} />
);

// --------------------------------------------------------------------------------
// SECTION components
// --------------------------------------------------------------------------------

const TopInsightBar = ({ topTrader, volume, winRate, strategy }) => (
    <div className="sticky top-0 z-[60] w-full px-4 pt-4 pb-2">
        <div className="glass-panel-heavy rounded-full px-8 py-3 flex items-center justify-between gap-8 overflow-hidden relative">
            {/* Soft Glow Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 animate-pulse" />
            
            <div className="flex items-center gap-10 whitespace-nowrap animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-2">
                    <Award size={14} className="text-term-warning" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top Trader Today:</span>
                    <span className="text-[10px] font-black text-white uppercase italic">{topTrader?.name || '---'}</span>
                    <span className="text-[10px] font-black text-term-success tabular-nums">+{topTrader?.roi || '0.0'}%</span>
                </div>
                
                <div className="h-4 w-px bg-white/10" />
                
                <div className="flex items-center gap-2">
                    <BarChart3 size={14} className="text-term-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Avg Win Rate:</span>
                    <span className="text-[10px] font-black text-white tabular-nums">{winRate || '84.2'}%</span>
                </div>

                <div className="h-4 w-px bg-white/10" />

                <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-term-secondary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Volume:</span>
                    <span className="text-[10px] font-black text-white tabular-nums">${volume || '142M+'}</span>
                </div>

                <div className="h-4 w-px bg-white/10" />

                <div className="flex items-center gap-2">
                    <Flame size={14} className="text-term-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trending Strategy:</span>
                    <div className="px-2 py-0.5 bg-term-accent/10 border border-term-accent/20 rounded text-[8px] font-black text-term-accent tracking-tighter uppercase">
                        {strategy || 'Macro Momentum'}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Market Active
                </div>
            </div>
        </div>
    </div>
);

const TraderCardRow = ({ trader, idx, isSelected, onSelect, onMirror, isFull, onUpgrade, isFollowing }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const movement = Math.floor(Math.random() * 5) - 2; // Simulated
    const score = Math.round(trader.whale_score || 0);
    
    const getScoreColor = (s) => {
        if (s > 80) return 'text-term-success drop-shadow-[0_0_10px_rgba(0,255,156,0.4)]';
        if (s > 60) return 'text-term-primary drop-shadow-[0_0_10px_rgba(0,255,198,0.3)]';
        return 'text-term-secondary/60';
    };

    const getRiskLabel = (level) => {
        if (level < 33) return { label: 'LOW', color: 'bg-emerald-500', text: 'text-emerald-500' };
        if (level < 66) return { label: 'MEDIUM', color: 'bg-term-warning', text: 'text-term-warning' };
        return { label: 'HIGH', color: 'bg-term-danger', text: 'text-term-danger' };
    };

    const risk = getRiskLabel(trader.risk_score || 45);
    const isTopThree = (trader.rank || idx + 1) <= 3;

    return (
        <div className="mb-3 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
            <div 
                onClick={() => onSelect(trader)}
                className={`row-hover-effect glass-panel-heavy rounded-[24px] overflow-hidden cursor-pointer border ${
                    isSelected ? 'border-term-primary/40 bg-term-primary/[0.03] shadow-lg shadow-term-primary/5' : 
                    (isTopThree ? 'border-term-primary/20 bg-term-primary/[0.01]' : 'border-white/5')
                }`}
            >
                <div className="flex items-center p-4 relative">
                    {isTopThree && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-term-primary/50 via-term-primary/20 to-transparent" />
                    )}
                    
                    {/* 1. RANK & MOVEMENT */}
                    <div className="w-20 shrink-0 flex flex-col items-center justify-center border-r border-white/5 pr-4">
                        <span className={`text-xl font-black leading-none mb-1 ${isTopThree ? 'text-white' : 'text-slate-700'}`}>{trader.rank || idx + 1}</span>
                        <div className={`flex items-center gap-0.5 text-[8px] font-black ${movement >= 0 ? 'text-emerald-500' : 'text-term-danger'}`}>
                            {movement >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {Math.abs(movement)}
                        </div>
                    </div>

                    {/* 2. IDENTITY BLOCK */}
                    <div className="flex-1 flex items-center gap-4 px-6">
                        <div className="relative group/avatar">
                            <div className={`w-12 h-12 rounded-xl bg-slate-900 border flex items-center justify-center overflow-hidden transition-transform group-hover/avatar:scale-110 ${isTopThree ? 'border-term-primary/30' : 'border-white/10'}`}>
                                {trader.profile_image ? (
                                    <img src={trader.profile_image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <span className="text-sm font-black text-slate-500">{trader.username?.[0] || 'W'}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-black uppercase tracking-tight ${isTopThree ? 'text-white' : 'text-slate-300'}`}>{trader.username || 'Anonymous Whale'}</span>
                                {isTopThree && <Shield size={12} className="text-term-primary fill-term-primary/10" />}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {['🐋 Whale', '⚡ Scalper'].map((tag, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-[7px] font-black text-slate-500 uppercase tracking-widest">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. PRIMARY METRIC: WHALESCORE */}
                    <div className="w-32 shrink-0 flex flex-col items-center border-x border-white/5 px-4">
                        <div className={`text-5xl font-black score-pulse tabular-nums tracking-tighter ${getScoreColor(score)}`}>
                            {score}
                        </div>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">WhaleScore</span>
                    </div>

                    {/* 4. PERFORMANCE LINE */}
                    <div className="flex-1 px-8 hidden md:flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Performance Matrix</span>
                            <span className="text-[10px] font-black text-white tabular-nums">Win {(trader.win_rate * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-300 tabular-nums">{trader.total_trades || Math.floor(Math.random() * 500) + 50}</span>
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">TRADES</span>
                            </div>
                            <div className="h-6 w-px bg-white/5" />
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-term-success tabular-nums">+$14.2K</span>
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">TOTAL PNL</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. RISK & TREND */}
                    <div className="w-48 shrink-0 flex items-center px-6 gap-6 border-l border-white/5">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <div className="flex justify-between items-center text-[8px] font-black tracking-widest">
                                <span className="text-slate-600 uppercase">Risk Profile</span>
                                <span className={risk.text}>{risk.label}</span>
                            </div>
                            <div className="risk-bar w-full">
                                <div className={`risk-bar-fill ${risk.color}`} style={{ width: `${trader.risk_score || 45}%` }} />
                            </div>
                        </div>
                        <div className="shrink-0 group/spark">
                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 text-right">Trend</div>
                            <div className="sparkline-animate">
                                <Sparkline data={[10, 22, 15, 28, 22, 35, 30]} width={60} height={20} />
                            </div>
                        </div>
                    </div>

                    {/* 6. SIGNAL & ACTIONS */}
                    <div className="w-56 shrink-0 flex items-center gap-4 pl-6 pr-2">
                        <div className="flex-1 bg-term-primary/5 border border-term-primary/10 rounded-xl p-2 text-center group-hover:border-term-primary/30 transition-all">
                           <div className="text-[10px] font-black text-term-primary tabular-nums tracking-tighter">+12.4% <span className="text-[7px] text-slate-500">(7d)</span></div>
                           <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Confidence: 94%</div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <button 
                                onClick={(e) => { e.stopPropagation(); isFull && !isFollowing ? onUpgrade() : onMirror(trader); }}
                                className="btn-neon px-4 py-2 rounded-lg text-slate-950 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                            >
                                {isFollowing ? 'SYNCING' : 'COPY'} <ArrowUpRight size={12} />
                            </button>
                            <button 
                                onClick={(e) => e.stopPropagation()}
                                className="px-4 py-2 border border-white/10 rounded-lg text-slate-500 text-[9px] font-black uppercase tracking-widest hover:border-white/20 hover:text-white transition-all"
                            >
                                <Star size={10} className="inline mr-1" /> WATCH
                            </button>
                        </div>
                    </div>

                    {/* EXPAND TRIGGER */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="p-2 text-slate-600 hover:text-white transition-colors"
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                {/* EXPANDED PANEL: RECENT TRADES */}
                {isExpanded && (
                    <div className="border-t border-white/5 bg-slate-950/40 p-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Live Execution History</h5>
                            <button className="text-[8px] font-black text-term-primary uppercase tracking-widest hover:underline">View Terminal Output →</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { asset: 'BTC', pnl: '+$1,200', success: true, time: '2m ago' },
                                { asset: 'ETH', pnl: '-$300', success: false, time: '15m ago' },
                                { asset: 'POLY', pnl: '+$800', success: true, time: '42m ago' }
                            ].map((trade, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${trade.success ? 'bg-term-success/10 text-term-success' : 'bg-term-danger/10 text-term-danger'}`}>
                                            {trade.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-white">{trade.asset}</div>
                                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{trade.time}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs font-black tabular-nums ${trade.success ? 'text-term-success' : 'text-term-danger'}`}>
                                        {trade.pnl}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TraderDetailPanel = ({ trader, onMirror, isFollowing, isFull, onUpgrade }) => {
    const [activeTab, setActiveTab] = useState('DNA');
    
    if (!trader) return (
        <div className="glass-panel-heavy rounded-[32px] p-12 flex flex-col items-center justify-center text-center gap-6 h-full min-h-[600px] border-dashed">
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 opacity-40">
                <MousePointer2 size={32} className="text-slate-500" />
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] max-w-[200px] leading-relaxed">
                Initiate Secure Handshake by Selecting a Trader Node
            </p>
        </div>
    );

    const winStreak = trader.win_streak || 5;
    const alphaScore = Math.round(trader.whale_score || 0);

    return (
        <div className="glass-panel-heavy rounded-[32px] overflow-hidden flex flex-col h-full sticky top-24 animate-in fade-in slide-in-from-right-8 duration-700">
            {/* TOP CARD: IDENTITY */}
            <div className="p-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1 shadow-2xl overflow-hidden shrink-0">
                         {trader.profile_image ? (
                            <img src={trader.profile_image} className="w-full h-full object-cover rounded-xl" alt="" />
                         ) : (
                            <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center text-xl font-black text-slate-500 uppercase">{trader.username?.[0] || 'W'}</div>
                         )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">{trader.username || 'Anonymous Whale'}</div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-term-primary/10 border border-term-primary/20 rounded-lg">
                                <Zap size={10} className="text-term-primary" />
                                <span className="text-[10px] font-black text-term-primary tabular-nums">{alphaScore} ALPHA</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-term-accent/10 border border-term-accent/20 rounded-lg">
                                <Flame size={10} className="text-term-accent fill-term-accent" />
                                <span className="text-[10px] font-black text-term-accent tabular-nums">{winStreak}W STREAK</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-white/5 shadow-inner">
                    {['DNA', 'SIM', 'INTEL'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                activeTab === tab 
                                    ? 'bg-term-primary text-slate-950 shadow-[0_0_20px_rgba(0,255,198,0.4)]' 
                                    : 'text-slate-600 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB CONTENT: SCROLLABLE */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeTab === 'DNA' && (
                    <div className="space-y-10 animate-fade-in">
                        {/* CORE PROFILE */}
                        <div className="space-y-4">
                            <h6 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Node Diagnostics</h6>
                            <div className="space-y-2">
                                {[
                                    { label: 'Primary Vector', value: 'Macro Scalping' },
                                    { label: 'Market Sector', value: 'Prediction Markets' },
                                    { label: 'Holding Period', value: '4.2H (Avg)' },
                                    { label: 'Exit Precision', value: '98.2%' }
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{row.label}</span>
                                        <span className="text-[10px] font-black text-white uppercase">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI INSIGHT BOX */}
                        <div className="p-6 bg-term-primary/[0.03] border border-term-primary/10 rounded-[24px] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Target size={32} className="text-term-primary" />
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={14} className="text-term-primary" />
                                <span className="text-[10px] font-black text-term-primary uppercase tracking-[0.2em]">Neural Insight Node</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic mb-4">
                                "This node displays high-alpha correlation in Political Outcome markets. 94% win rate on binary resolution events."
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-term-primary shadow-[0_0_8px_rgba(0,255,198,0.5)]" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">94% CONFIDENCE RATING</span>
                            </div>
                        </div>

                        {/* WHY COPY THIS TRADER */}
                        <div className="space-y-4">
                            <h6 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Terminal Advantages</h6>
                            <div className="space-y-3">
                                {[
                                    { icon: <CheckCircle2 size={14} className="text-term-success" />, text: "Consistent real-money profits" },
                                    { icon: <CheckCircle2 size={14} className="text-term-success" />, text: "Low drawdown (<12% max)" },
                                    { icon: <CheckCircle2 size={14} className="text-term-success" />, text: "Strong trend accuracy vectors" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        {item.icon}
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'SIM' && (
                    <div className="flex flex-col items-center justify-center p-12 text-center opacity-30 gap-4">
                        <Timer size={40} className="text-term-secondary animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Simulation Engine Synchronizing...</span>
                    </div>
                )}

                {activeTab === 'INTEL' && (
                    <div className="flex flex-col items-center justify-center p-12 text-center opacity-30 gap-4">
                        <Activity size={40} className="text-term-danger animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Intel Stream Inactive</span>
                    </div>
                )}
            </div>

            {/* SOCIAL PROOF & CTA */}
            <div className="p-8 pt-6 border-t border-white/5 bg-slate-950/30">
                <div className="flex items-center justify-center gap-6 mb-8">
                    <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[9px] font-black text-slate-500">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white tabular-nums">1.2K+ COPYING</span>
                        <span className="text-[8px] font-black text-term-success uppercase tracking-widest">+12 TODAY</span>
                    </div>
                </div>

                <button 
                    onClick={() => isFull && !isFollowing ? onUpgrade() : onMirror(trader)}
                    className="w-full btn-neon py-6 rounded-[24px] flex flex-col items-center justify-center gap-1 group/cta"
                >
                    <div className="flex items-center gap-3">
                        <Zap size={20} className="text-slate-950 fill-slate-950 group-hover:scale-110 transition-transform" />
                        <span className="text-lg font-black text-slate-950 uppercase tracking-[0.3em]">
                            {isFull && !isFollowing ? 'UPGRADE' : (isFollowing ? 'SYNC ACTIVE' : 'START COPYING')}
                        </span>
                    </div>
                    <span className="text-[9px] font-black text-slate-950/60 uppercase tracking-widest">Low Latency Signal Mirroring</span>
                </button>

                <p className="mt-6 text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0 italic">
                    "🔥 120 users successfully mirrored today"
                </p>
            </div>
        </div>
    );
};

// --------------------------------------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------------------------------------

const Leaderboard = () => {
    const { user } = useContext(AuthContext);
    const { settings, refreshStrategies } = useContext(PortfolioContext);
    const navigate = useNavigate();
    
    const [traders, setTraders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('WEEK');
    const [sortBy, setSortBy] = useState('SCORE');
    const [selectedTrader, setSelectedTrader] = useState(null);
    const [mirroringStatus, setMirroringStatus] = useState(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    // Initial Fetch
    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/traders/leaderboard?timeframe=${timeframe}&sort_by=${sortBy}`);
                if (res.ok) {
                    const data = await res.json();
                    const tradersData = data.traders || [];
                    setTraders(tradersData);
                    if (tradersData.length > 0 && !selectedTrader) {
                        setSelectedTrader(tradersData[0]);
                    }
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchLeaderboard();
    }, [timeframe, sortBy]);

    const handleMirror = async (trader) => {
        if (!user) { navigate('/login'); return; }
        setMirroringStatus('INITIALIZING...');
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const userId = user.user_id || user.userId;
            const res = await fetch(`${apiUrl}/api/strategies/mirror?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    address: trader.address || '0x0000', 
                    username: trader.username || 'Anonymous Whale', 
                    risk_mode: 'Balanced' 
                })
            });
            if (res.status === 403) { setIsUpgradeModalOpen(true); setMirroringStatus(null); return; }
            if (res.ok) {
                if (refreshStrategies) await refreshStrategies();
                setMirroringStatus('SYNCED!');
                setTimeout(() => navigate('/simulator'), 800);
            }
        } catch (err) { console.error(err); setMirroringStatus(null); }
    };

    return (
        <div className="w-full flex justify-center bg-[#061018] min-h-screen term-font pb-20">
            <DesignSystemStyles />
            
            <div className="w-[95%] max-w-[1920px] pt-8 flex flex-col gap-6">
                
                {/* 1. TOP INSIGHT BAR (Sticky Header Area) */}
                <TopInsightBar 
                    topTrader={traders[0] ? { name: traders[0].username, roi: (traders[0].roi || 12.4).toFixed(1) } : null}
                    volume="142.8M"
                    winRate="84"
                    strategy="Political Alpha"
                />

                <div className="flex flex-col lg:flex-row gap-10 mt-6 min-h-[800px]">
                    
                    {/* 2. LEADERBOARD TABLE (Core Area) */}
                    <div className="flex-1 flex flex-col gap-8">
                        
                        {/* HEADER & FILTERS */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
                            <div>
                                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex flex-col">
                                    <span className="text-term-primary text-sm tracking-[0.5em] mb-1 italic-none">Institutional</span>
                                    Alpha Vector <span className="text-slate-700">Database</span>
                                </h1>
                            </div>
                            
                            {/* FILTERS PANEL */}
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                                    {['DAY', 'WEEK', 'MONTH', 'ALL'].map(tf => (
                                        <button 
                                            key={tf}
                                            onClick={() => setTimeframe(tf)}
                                            className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                                timeframe === tf ? 'bg-white/10 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'
                                            }`}
                                        >
                                            {tf}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                                    {[
                                        { id: 'SCORE', label: 'WhaleScore' },
                                        { id: 'ROI', label: 'ROI' },
                                        { id: 'VOLUME', label: 'Volume' }
                                    ].map(sort => (
                                        <button 
                                            key={sort.id}
                                            onClick={() => setSortBy(sort.id)}
                                            className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                                sortBy === sort.id ? 'bg-term-primary/10 text-term-primary' : 'text-slate-600 hover:text-slate-400'
                                            }`}
                                        >
                                            {sort.label}
                                        </button>
                                    ))}
                                </div>
                                
                                <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-colors">
                                    <Filter size={16} />
                                </button>
                            </div>
                        </div>

                        {/* DATA LIST */}
                        <div className="flex flex-col custom-scrollbar">
                            {loading ? (
                                <div className="h-[600px] flex flex-col items-center justify-center gap-6">
                                    <Activity size={48} className="text-term-primary animate-pulse opacity-30" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[1em]">Synchronizing Orderbook Nodes...</span>
                                </div>
                            ) : (
                                traders.map((trader, idx) => {
                                    const isFollowing = settings?.copy_sources?.some(s => s.address === trader.address);
                                    const isFull = (settings?.copy_sources?.length || 0) >= (settings?.source_slots || 10);
                                    
                                    return (
                                        <TraderCardRow 
                                            key={trader.address || idx}
                                            trader={trader}
                                            idx={idx}
                                            isSelected={selectedTrader?.address === trader.address}
                                            onSelect={setSelectedTrader}
                                            onMirror={handleMirror}
                                            isFull={isFull}
                                            onUpgrade={() => setIsUpgradeModalOpen(true)}
                                            isFollowing={isFollowing}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 3. RIGHT INSIGHT PANEL (TRADER DETAILS) */}
                    <div className="w-full lg:w-[420px] shrink-0">
                        <TraderDetailPanel 
                            trader={selectedTrader} 
                            onMirror={handleMirror}
                            isFollowing={settings?.copy_sources?.some(s => s.address === selectedTrader?.address)}
                            isFull={(settings?.copy_sources?.length || 0) >= (settings?.source_slots || 10)}
                            onUpgrade={() => setIsUpgradeModalOpen(true)}
                        />
                    </div>

                </div>
            </div>

            {/* UPGRADE MODAL INTEGRATION */}
            {isUpgradeModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in px-4">
                    <div className="glass-panel-heavy max-w-md w-full p-10 rounded-[40px] text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-term-primary via-term-secondary to-term-primary" />
                        <div className="flex justify-center mb-8">
                            <div className="p-5 rounded-3xl bg-term-primary/10 border border-term-primary/20">
                                <Sparkles size={48} className="text-term-primary animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter text-white">Capacity Warning</h3>
                        <p className="text-slate-500 text-sm mb-10 leading-relaxed font-bold uppercase tracking-wide">
                            Mirror Limit Reached. Upgrade to <span className="text-term-primary">Terminal Pro</span> for unlimited alpha vectors.
                        </p>
                        <div className="flex flex-col gap-4">
                            <Link 
                                to="/subscription"
                                className="w-full btn-neon py-5 text-slate-950 font-black uppercase tracking-widest rounded-2xl no-underline text-center"
                                onClick={() => setIsUpgradeModalOpen(false)}
                            >
                                Unlock Pro Access
                            </Link>
                            <button 
                                onClick={() => setIsUpgradeModalOpen(false)}
                                className="w-full py-2 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
