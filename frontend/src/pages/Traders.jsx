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

        body { overflow-x: hidden !important; width: 100%; position: relative; }
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
            
            <div className="flex items-center gap-6 md:gap-10 whitespace-nowrap animate-in fade-in slide-in-from-top-4 duration-700 overflow-hidden">
                <div className="flex items-center gap-2 relative z-10 group shrink-0">
                    <Award size={14} className="text-term-warning" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Top Trader Today:</span>
                    {topTrader?.address ? (
                        <a 
                            href={`https://polymarket.com/profile/${topTrader.address}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-black text-white uppercase italic hover:text-term-primary transition-colors cursor-pointer flex items-center gap-1"
                        >
                            {topTrader.name || '---'}
                            <ExternalLink size={10} className="text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </a>
                    ) : (
                        <span className="text-[10px] font-black text-white uppercase italic">{topTrader?.name || '---'}</span>
                    )}
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

const TraderCardRow = ({ trader, idx, isSelected, onSelect, onMirror, isFull, onUpgrade, isFollowing, isWatched, onWatch }) => {
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
                    <div className="w-12 md:w-16 shrink-0 flex flex-col items-center justify-center border-r border-white/5 pr-4">
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
                        <div className="flex flex-col gap-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-black uppercase tracking-tight truncate max-w-[140px] md:max-w-[220px] ${isTopThree ? 'text-white' : 'text-slate-300'}`}>
                                    {trader.username || 'Anonymous Whale'}
                                </span>
                                {isTopThree && <Shield size={12} className="text-term-primary fill-term-primary/10 shrink-0" />}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {['🐋 Whale', '⚡ Scalper'].map((tag, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-[7px] font-black text-slate-500 uppercase tracking-widest">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. PRIMARY METRIC: WHALESCORE */}
                    <div className="w-20 md:w-24 shrink-0 flex flex-col items-center border-x border-white/5 px-2">
                        <div className={`text-2xl md:text-4xl font-black score-pulse tabular-nums tracking-tighter ${getScoreColor(score)}`}>
                            {score}
                        </div>
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-1">Score</span>
                    </div>

                    {/* 4. CONSOLIDATED PERFORMANCE MATRIX */}
                    <div className="flex-1 px-4 md:px-8 hidden 2xl:flex flex-col gap-2 min-w-[400px]">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Matrix</span>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-white tabular-nums">{trader.total_trades || 124}</span>
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">TRADES</span>
                            </div>
                            <div className="h-6 w-px bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-term-success tabular-nums">+$14.2K <TrendingUp size={10} className="inline ml-1" /></span>
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">PNL VECTOR</span>
                            </div>
                            <div className="h-6 w-px bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-white tabular-nums">{(trader.win_rate * 100).toFixed(0)}%</span>
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">WIN RATE</span>
                            </div>
                            <div className="h-6 w-px bg-white/10" />
                            <div className="flex flex-col">
                                <span className={`text-[10px] font-black ${risk.text} uppercase`}>{risk.label}</span>
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">RISK PROFILE</span>
                            </div>
                            <div className="h-6 w-px bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-term-primary tabular-nums">94%</span>
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">CONFIDENCE</span>
                            </div>
                        </div>
                    </div>

                    {/* 6. ACTIONS */}
                    <div className="w-40 md:w-48 shrink-0 flex items-center justify-end gap-2 md:gap-4 pl-4 md:pl-6 pr-2">
                        <div className="flex flex-col gap-1.5">
                            <button 
                                onClick={(e) => { e.stopPropagation(); isFull && !isFollowing ? onUpgrade() : onMirror(trader); }}
                                className="btn-neon px-4 py-2 rounded-lg text-slate-950 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                            >
                                {isFollowing ? 'SYNCING' : 'COPY'} <ArrowUpRight size={12} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onWatch(trader); }}
                                className={`px-4 py-2 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                    isWatched 
                                        ? 'bg-term-primary/10 border-term-primary text-term-primary shadow-[0_0_15px_rgba(0,255,198,0.2)]' 
                                        : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                                }`}
                            >
                                <Star size={10} className={`inline mr-1 ${isWatched ? 'fill-term-primary' : ''}`} /> {isWatched ? 'WATCHING' : 'WATCH'}
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
                        {trader.address ? (
                            <a 
                                href={`https://polymarket.com/profile/${trader.address}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none hover:text-term-primary transition-colors no-underline flex items-center gap-2 group/title"
                            >
                                {trader.username || 'Anonymous Whale'}
                                <ExternalLink size={16} className="text-slate-500 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                            </a>
                        ) : (
                            <div className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">{trader.username || 'Anonymous Whale'}</div>
                        )}
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

                <div className="flex gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-white/5 shadow-inner mb-6">
                    {['DNA', 'SIM', 'INTEL'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                activeTab === tab 
                                    ? 'bg-[#00FFC6] text-[#061018] shadow-[0_0_20px_rgba(0,255,198,0.4)]' 
                                    : 'text-slate-600 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* SOCIAL PROOF & CTA (Moved to Top) */}
                <div className="p-4 bg-slate-950/30 rounded-[24px] border border-white/5 mb-6">
                    <button 
                        onClick={() => isFull && !isFollowing ? onUpgrade() : onMirror(trader)}
                        className="w-full btn-neon py-5 rounded-[20px] flex flex-col items-center justify-center gap-1 group/cta"
                    >
                        <div className="flex items-center gap-3">
                            <Zap size={18} className="text-slate-950 fill-slate-950 group-hover:scale-110 transition-transform" />
                            <span className="text-base font-black text-slate-950 uppercase tracking-[0.2em]">
                                {isFull && !isFollowing ? 'UPGRADE' : (isFollowing ? 'SYNC ACTIVE' : 'START COPYING')}
                            </span>
                        </div>
                    </button>
                    <div className="flex items-center justify-between mt-4 px-2">
                        <div className="flex -space-x-2">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border border-slate-950 bg-slate-800 flex items-center justify-center text-[7px] font-black text-slate-500">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <span className="text-[9px] font-black text-term-success uppercase tracking-widest">120 Successful Mirrors Today</span>
                    </div>
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
                    <div className="space-y-6 animate-fade-in">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                            <h6 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Live Simulation Stream</h6>
                            <div className="space-y-3">
                                {[
                                    { msg: 'Aggregating orderbook depth...', status: 'complete' },
                                    { msg: 'Calculating latent volatility...', status: 'active' },
                                    { msg: 'Syncing cross-chain vectors...', status: 'waiting' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400">{item.msg}</span>
                                        <div className={`w-2 h-2 rounded-full ${item.status === 'complete' ? 'bg-term-success' : item.status === 'active' ? 'bg-term-primary animate-pulse' : 'bg-slate-700'}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'INTEL' && (
                    <div className="space-y-6 animate-fade-in">
                         <div className="p-4 bg-term-primary/5 border border-term-primary/20 rounded-2xl">
                            <div className="flex items-center gap-2 mb-3">
                                <Activity size={12} className="text-term-primary" />
                                <h6 className="text-[9px] font-black text-term-primary uppercase tracking-widest">Whale Movements (24H)</h6>
                            </div>
                            <div className="text-[10px] font-bold text-slate-300 leading-relaxed">
                                This node has increased exposure by 12% in the last 4 hours, primarily in <span className="text-white">Political Alpha</span> sectors.
                            </div>
                         </div>
                    </div>
                )}
            </div>

            {/* REMOVED BOTTOM CTA BLOCK (MOVED TO TOP) */}
        </div>
    );
};

// --------------------------------------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------------------------------------

const GlobalLeaderboard = () => {
    const { user } = useContext(AuthContext);
    const { settings, refreshStrategies } = useContext(PortfolioContext);
    const navigate = useNavigate();
    
    const [traders, setTraders] = useState([]);
    const [filteredTraders, setFilteredTraders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('WEEK');
    const [sortBy, setSortBy] = useState('SCORE');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [selectedTrader, setSelectedTrader] = useState(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Filtering States
    const [search, setSearch] = useState('');
    const [minWinRate, setMinWinRate] = useState(0);
    const [riskProfile, setRiskProfile] = useState('ALL');
    const [minTrades, setMinTrades] = useState(0);
    const [showWatchedOnly, setShowWatchedOnly] = useState(false);

    // Initial Fetch
    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/traders/leaderboard?timeframe=${timeframe}&sort_by=${sortBy}&sort_order=${sortOrder}`);
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
    }, [timeframe, sortBy, sortOrder]);

    // Apply Filtering
    useEffect(() => {
        let result = [...traders];
        
        if (search) {
            result = result.filter(t => t.username?.toLowerCase().includes(search.toLowerCase()));
        }
        
        if (minWinRate > 0) {
            result = result.filter(t => (t.win_rate * 100) >= minWinRate);
        }
        
        if (riskProfile !== 'ALL') {
            result = result.filter(t => {
                if (riskProfile === 'LOW') return t.risk_score < 33;
                if (riskProfile === 'MEDIUM') return t.risk_score >= 33 && t.risk_score < 66;
                if (riskProfile === 'HIGH') return t.risk_score >= 66;
                return true;
            });
        }
        
        if (minTrades > 0) {
            result = result.filter(t => (t.total_trades || 0) >= minTrades);
        }
        
        if (showWatchedOnly && user?.watchlist) {
            result = result.filter(t => user.watchlist.some(w => w.address === (t.address || t.wallet_address)));
        }
        
        setFilteredTraders(result);
    }, [traders, search, minWinRate, riskProfile, minTrades, showWatchedOnly, user?.watchlist]);

    const handleWatch = async (trader) => {
        if (!user) { navigate('/login'); return; }
        const address = trader.address || trader.wallet_address;
        const isCurrentlyWatched = user.watchlist?.some(t => t.address === address);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const userId = user.user_id || user.userId;

        try {
            if (isCurrentlyWatched) {
                const res = await fetch(`${apiUrl}/api/portfolio/watchlist/${address}?user_id=${userId}`, { method: 'DELETE' });
                if (res.ok) {
                    const updatedWatchlist = (user.watchlist || []).filter(t => t.address !== address);
                    user.watchlist = updatedWatchlist;
                    setTraders([...traders]);
                }
            } else {
                const res = await fetch(`${apiUrl}/api/portfolio/watchlist?user_id=${userId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        address: address, 
                        username: trader.username || 'Anonymous Whale',
                        image_url: trader.profile_image || null
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    const updatedWatchlist = [...(user.watchlist || []), data.trader];
                    user.watchlist = updatedWatchlist;
                    setTraders([...traders]);
                }
            }
        } catch (err) { console.error(err); }
    };

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
        <div className="w-full flex justify-center bg-[#061018] min-h-screen term-font pb-20 overflow-x-hidden">
            <DesignSystemStyles />
            
            <div className="w-[95%] max-w-[1920px] pt-8 flex flex-col gap-6">
                
                {/* 1. TOP INSIGHT BAR (Sticky Header Area) */}
                <TopInsightBar 
                    topTrader={traders[0] ? { 
                        name: traders[0].username, 
                        address: traders[0].address || traders[0].wallet_address,
                        roi: (traders[0].roi || 12.4).toFixed(1) 
                    } : null}
                    volume="142.8M"
                    winRate="84"
                    strategy="Political Alpha"
                />

                {/* Primary Content (Leaderboard + Detailed Insight) */}
                <div className="flex flex-col lg:flex-row gap-6 mt-6 min-h-[800px]">
                    {/* 7. LEADERBOARD LIST (Left Column) */}
                    <div className="flex-1 flex flex-col gap-3 min-w-0 pb-10">
                        
                        {/* HEADER & FILTERS */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
                            <div>
                                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex flex-col">
                                    <span className="text-term-primary text-sm tracking-[0.5em] mb-1 italic-none">Institutional</span>
                                    Alpha Vector <span className="text-slate-700">Database</span>
                                </h1>
                            </div>
                            
                            {/* FILTERS PANEL */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-term-primary transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="SEARCH TRADER..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-6 text-[10px] font-black text-white focus:outline-none focus:border-term-primary/40 focus:bg-term-primary/[0.02] transition-all w-full md:w-64 tracking-widest placeholder:text-slate-700"
                                        />
                                    </div>

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

                                    <button 
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={`p-3 border rounded-2xl transition-all ${isFilterOpen ? 'bg-term-primary/10 border-term-primary text-term-primary' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                                    >
                                        <Filter size={16} />
                                    </button>
                                </div>

                                {isFilterOpen && (
                                    <div className="flex flex-wrap items-center gap-6 p-6 bg-slate-900/40 border border-white/5 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Direction</span>
                                            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl">
                                                {['DESC', 'ASC'].map(order => (
                                                    <button 
                                                        key={order}
                                                        onClick={() => setSortOrder(order)}
                                                        className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                                            sortOrder === order ? 'bg-[#00FFC6] text-[#061018]' : 'text-slate-500 hover:text-slate-300'
                                                        }`}
                                                    >
                                                        {order}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-10 w-px bg-white/5" />

                                        <div className="flex flex-col gap-2">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Sort By</span>
                                            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl">
                                                {[
                                                    { id: 'SCORE', label: 'WhaleScore' },
                                                    { id: 'ROI', label: 'ROI' },
                                                    { id: 'VOLUME', label: 'Volume' }
                                                ].map(sort => (
                                                    <button 
                                                        key={sort.id}
                                                        onClick={() => setSortBy(sort.id)}
                                                        className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                                            sortBy === sort.id ? 'bg-[#00FFC6] text-[#061018]' : 'text-slate-500 hover:text-slate-300'
                                                        }`}
                                                    >
                                                        {sort.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-10 w-px bg-white/5" />

                                        <div className="flex flex-col gap-2">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Win Rate Min: {minWinRate}%</span>
                                            <input 
                                                type="range" min="0" max="95" step="5" 
                                                value={minWinRate}
                                                onChange={(e) => setMinWinRate(parseInt(e.target.value))}
                                                className="w-32 accent-term-primary"
                                            />
                                        </div>

                                        <div className="h-10 w-px bg-white/5" />

                                        <div className="flex flex-col gap-2">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Risk Profile</span>
                                            <select 
                                                value={riskProfile}
                                                onChange={(e) => setRiskProfile(e.target.value)}
                                                className="bg-black/20 text-[8px] font-black text-slate-300 uppercase py-1 px-2 rounded-lg border-none focus:ring-0 cursor-pointer"
                                            >
                                                <option value="ALL">ALL RISK</option>
                                                <option value="LOW">LOW ONLY</option>
                                                <option value="MEDIUM">MEDIUM ONLY</option>
                                                <option value="HIGH">HIGH ONLY</option>
                                            </select>
                                        </div>

                                        <div className="h-10 w-px bg-white/5" />

                                        <button 
                                            onClick={() => setShowWatchedOnly(!showWatchedOnly)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${
                                                showWatchedOnly ? 'bg-term-primary/10 border-term-primary text-term-primary' : 'border-white/10 text-slate-500'
                                            }`}
                                        >
                                            <Star size={10} className={showWatchedOnly ? 'fill-term-primary' : ''} />
                                            {showWatchedOnly ? 'WATCHED' : 'WATCHING'}
                                        </button>

                                        <button 
                                            onClick={() => {
                                                setSearch('');
                                                setMinWinRate(0);
                                                setRiskProfile('ALL');
                                                setMinTrades(0);
                                                setShowWatchedOnly(false);
                                                setSortBy('SCORE');
                                                setSortOrder('DESC');
                                                setTimeframe('WEEK');
                                            }}
                                            className="ml-auto px-4 py-2 border border-slate-800 rounded-xl text-[8px] font-black text-slate-400 hover:text-term-danger hover:border-term-danger/50 uppercase tracking-widest transition-all"
                                        >
                                            Reset All Node Filters
                                        </button>
                                    </div>
                                )}
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
                                filteredTraders.map((trader, idx) => {
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
                                            isWatched={user?.watchlist?.some(t => t.address === (trader.address || trader.wallet_address))}
                                            onWatch={handleWatch}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 3. RIGHT INSIGHT PANEL (TRADER DETAILS) */}
                    <div className="w-full lg:w-[340px] shrink-0 bg-slate-900/40 rounded-3xl border border-white/5 h-fit sticky top-[100px]">
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

export default GlobalLeaderboard;
