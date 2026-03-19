import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Target, Shield, Clock, ExternalLink, ChevronDown, ChevronUp, Zap, Activity, AlertCircle, Sparkles } from 'lucide-react';
import Sparkline from '../components/Sparkline';
import RiskMeter from '../components/RiskMeter';

const UpgradeModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel max-w-md w-full p-8 text-center border-primary/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                        <Sparkles size={40} className="text-primary animate-pulse" />
                    </div>
                </div>
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Slots Exhausted</h3>
                <p className="text-muted text-sm mb-8 leading-relaxed">
                    You've reached the maximum number of active mirror strategies for your current plan. Upgrade to <span className="text-primary font-bold">WhaleSync Pro</span> for unlimited source slots and institutional-grade alpha.
                </p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => window.location.href = '/subscriptions'}
                        className="w-full py-3 bg-primary text-white font-black uppercase tracking-widest rounded hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
                    >
                        Unlock Pro Access
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-3 text-muted text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

const TraderRow = ({ trader, idx, formatCurrency, onMirror }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Dynamic Forecast Calculation (based on 10% allocation of 10k capital, weekly estimate)
    const baseAllocation = 1000; // $1,000 mirrored
    const weeklyROI = (trader.adjusted_roi || 0) * 0.15; // 15% of annual/total ROI for a week heuristic
    const forecastAmount = (baseAllocation * weeklyROI) / 100;

    return (
        <>
            <tr 
                className={`table-row-hover animate-fade-in stagger-${(idx % 5) + 1}`} 
                style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '50%', 
                        background: idx < 3 ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                        color: idx < 3 ? 'white' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        fontWeight: '800'
                    }}>
                        {trader.rank || idx + 1}
                    </div>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                    <div className="flex items-center gap-2">
                        <a 
                            href={`https://polymarket.com/profile/${trader.address}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:scale-110 transition-transform block"
                        >
                            {trader.profile_image ? (
                                <img src={trader.profile_image} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }} />
                            ) : (
                                <div style={{ 
                                    width: '24px', 
                                    height: '24px', 
                                    borderRadius: '50%', 
                                    background: 'linear-gradient(45deg, var(--primary), var(--accent))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold'
                                }}>
                                    {trader.username ? trader.username[0].toUpperCase() : 'W'}
                                </div>
                            )}
                        </a>
                        <div style={{ maxWidth: '160px', overflow: 'hidden' }}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <a 
                                    href={`https://polymarket.com/profile/${trader.address}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <p style={{ margin: 0, fontWeight: '700', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trader.username || 'Anonymous Whale'}</p>
                                    <ExternalLink size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                                {trader.tags?.slice(0, 2).map(tag => (
                                    <span key={tag} style={{ 
                                        fontSize: '0.45rem', 
                                        padding: '0.05rem 0.25rem', 
                                        borderRadius: '3px', 
                                        background: 'rgba(59, 130, 246, 0.15)', 
                                        color: 'var(--primary)',
                                        textTransform: 'uppercase',
                                        fontWeight: '800'
                                    }}>{tag}</span>
                                ))}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.6rem', opacity: 0.4 }}>{trader.address ? `${trader.address.slice(0, 4)}...${trader.address.slice(-3)}` : '0x...'}</p>
                        </div>
                    </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div className="flex flex-col items-end">
                        <span style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '0.9rem', lineHeight: 1 }}>{Math.round(trader.whale_score || 0)}</span>
                        <span style={{ fontSize: '0.5rem', fontWeight: '800', opacity: 0.4, marginTop: '2px' }}>WHALE SCORE</span>
                    </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div className="flex flex-col items-end">
                        <span style={{ fontWeight: '700', fontSize: '0.8rem', color: trader.adjusted_roi >= 0 ? 'var(--success)' : 'var(--danger)', lineHeight: 1 }}>
                            {trader.adjusted_roi ? `${trader.adjusted_roi.toFixed(1)}%` : '0%'}
                        </span>
                        <span style={{ fontSize: '0.5rem', opacity: 0.4, marginTop: '2px' }}>ADJ. ROI</span>
                    </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>
                        {trader.win_rate ? `${(trader.win_rate * 100).toFixed(1)}%` : '0%'}
                    </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div className="flex flex-col items-end">
                        <span style={{ fontWeight: '700', fontSize: '0.8rem', lineHeight: 1 }}>{trader.total_trades || 0}</span>
                        <div className="mt-1 opacity-60">
                            <Sparkline data={trader.pnl_history} width={45} height={10} color={trader.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                        </div>
                    </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <RiskMeter score={trader.risk_score || 0.5} />
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMirror(trader); }}
                            className="btn-outline hover-glow" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.1)', borderColor: 'var(--primary)', borderRadius: '4px' }}
                        >
                            Mirror
                        </button>
                        {isExpanded ? <ChevronUp size={12} className="text-muted" /> : <ChevronDown size={12} className="text-muted" />}
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <td colSpan="8" style={{ padding: '1rem 2rem' }}>
                        <div className="flex items-center justify-between gap-8 border-l-2 border-primary/30 pl-6">
                            <div className="flex-1">
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-tighter text-muted font-bold mb-0.5">Total Volume</p>
                                        <p className="text-xs font-mono font-medium">{formatCurrency(trader.volume)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-tighter text-muted font-bold mb-0.5">Realized PNL</p>
                                        <p className="text-xs font-mono font-medium" style={{ color: trader.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(trader.pnl)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-tighter text-muted font-bold mb-0.5">Network Rank</p>
                                        <p className="text-xs font-mono font-medium">Top 0.8%</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-tighter text-muted font-bold mb-0.5">Signal Alpha</p>
                                        <p className="text-xs font-mono font-medium text-primary">High Confidence</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6 py-2 px-4 rounded-lg bg-black/20 border border-white/5">
                                <div className="text-right">
                                    <p className="text-[8px] uppercase font-black text-primary tracking-widest leading-none mb-1">Mirror Forecast</p>
                                    <div className="flex items-center justify-end gap-1">
                                        <TrendingUp size={10} className={forecastAmount >= 0 ? "text-success" : "text-danger"} />
                                        <span className="text-sm font-black text-white">
                                            {forecastAmount >= 0 ? '+' : ''}{formatCurrency(forecastAmount)}
                                        </span>
                                        <span className="text-[8px] text-muted ml-1">/ 7D</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onMirror(trader)}
                                    className="py-2 px-4 bg-primary hover:bg-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded transition-all transform hover:scale-105 shadow-lg shadow-primary/20"
                                >
                                    Execute Copy
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const Leaderboard = () => {
    const [traders, setTraders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('WEEK');
    const [sortBy, setSortBy] = useState('SCORE');
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [mirroringStatus, setMirroringStatus] = useState(null);

    const handleMirror = async (trader) => {
        const userId = "temp-user-123"; // TODO: Get from auth context
        setMirroringStatus('Processing...');
        
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/strategies/mirror?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: trader.address,
                    username: trader.username || 'Anonymous'
                })
            });

            if (res.status === 403) {
                const data = await res.json();
                if (data.detail === "SLOTS_FULL") {
                    setIsUpgradeModalOpen(true);
                }
            } else if (!res.ok) {
                const data = await res.json();
                alert(data.detail || "Failed to mirror strategy");
            } else {
                alert(`Successfully mirroring ${trader.username}! Check your strategies page.`);
            }
        } catch (err) {
            console.error("Mirror failed:", err);
            alert("Connection error. Please try again.");
        } finally {
            setMirroringStatus(null);
        }
    };

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/traders/leaderboard?timeframe=${timeframe}&sort_by=${sortBy}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setTraders(data.traders || []);
            } catch (err) {
                console.error("Leaderboard fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [timeframe, sortBy]);

    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="container mt-12 animate-fade-in" style={{ paddingBottom: '5rem' }}>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '-2px' }}>
                        Global <span className="text-primary italic">Leaderboard</span>
                    </h1>
                    <p className="text-muted text-sm font-medium">Institutional-grade performance tracking and risk-aware trader rankings.</p>
                </div>
                
                <div className="flex flex-col gap-3">
                    <div className="flex gap-1.5 self-end">
                        {['DAY', 'WEEK', 'MONTH', 'ALL'].map(tf => (
                            <button 
                                key={tf}
                                className={`btn-outline ${timeframe === tf ? 'active' : ''}`}
                                style={{ 
                                    padding: '0.3rem 0.6rem', 
                                    fontSize: '0.7rem',
                                    minWidth: '60px',
                                    borderColor: timeframe === tf ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                                    background: timeframe === tf ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                    borderRadius: '4px',
                                    fontWeight: '800'
                                }}
                                onClick={() => setTimeframe(tf)}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="glass-panel animate-fade-in stagger-1" style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 100%)' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Zap size={14} className="text-primary" />
                        <h4 className="text-muted uppercase text-[9px] font-bold tracking-widest">TOP ADJ. ROI</h4>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>
                        {traders.length > 0 ? `${Math.max(...traders.map(t => t.adjusted_roi || 0)).toFixed(1)}%` : '0.0%'}
                    </p>
                </div>
                
                <div className="glass-panel animate-fade-in stagger-2" style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(0,0,0,0) 100%)' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Award size={14} className="text-success" />
                        <h4 className="text-muted uppercase text-[9px] font-bold tracking-widest">AVG WIN RATE</h4>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>
                        {traders.length > 0 ? `${(traders.reduce((acc, t) => acc + (t.win_rate || 0), 0) / traders.length * 100).toFixed(1)}%` : '0.0%'}
                    </p>
                </div>

                <div className="glass-panel animate-fade-in stagger-3" style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(0,0,0,0) 100%)' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Shield size={14} className="text-accent" />
                        <h4 className="text-muted uppercase text-[9px] font-bold tracking-widest">TOTAL VOLUME</h4>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>
                        {formatCurrency(traders.reduce((acc, t) => acc + (t.volume || 0), 0))}
                    </p>
                </div>
            </div>

            <div className="glass-panel w-full" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '800', fontSize: '0.65rem', color: 'var(--text-muted)', width: '40px' }}>#</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '800', fontSize: '0.65rem', color: 'var(--text-muted)', width: '220px' }}>TRADER</th>
                                <th 
                                    style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '0.65rem', cursor: 'pointer', color: sortBy === 'SCORE' ? 'var(--primary)' : 'var(--text-muted)', width: '90px' }}
                                    onClick={() => setSortBy('SCORE')}
                                >
                                    SCORE {sortBy === 'SCORE' && '↓'}
                                </th>
                                <th 
                                    style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '0.65rem', cursor: 'pointer', color: sortBy === 'ADJUSTED_ROI' ? 'var(--primary)' : 'var(--text-muted)', width: '100px' }}
                                    onClick={() => setSortBy('ADJUSTED_ROI')}
                                >
                                    ADJ. ROI {sortBy === 'ADJUSTED_ROI' && '↓'}
                                </th>
                                <th 
                                    style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '0.65rem', cursor: 'pointer', color: sortBy === 'WIN_RATE' ? 'var(--primary)' : 'var(--text-muted)', width: '100px' }}
                                    onClick={() => setSortBy('WIN_RATE')}
                                >
                                    WIN RATE {sortBy === 'WIN_RATE' && '↓'}
                                </th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '0.65rem', color: 'var(--text-muted)', width: '90px' }}>TRADES</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '0.65rem', color: 'var(--text-muted)', width: '100px' }}>RISK</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '0.65rem', color: 'var(--text-muted)', width: '110px' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '6rem' }}>
                                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                                        <p className="text-muted mt-4 font-bold tracking-widest text-[10px]">ENRICHING TRADER GENOMES...</p>
                                    </td>
                                </tr>
                            ) : traders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '4rem' }}>
                                        <p className="text-muted">No data available for this timeframe.</p>
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
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
            </div>

            <div className="mt-8 flex items-center gap-4 text-[10px] text-muted font-bold tracking-widest uppercase">
                <div className="flex items-center gap-2">
                    <Clock size={12} />
                    <span>Live Syncing via Gamma & Data API</span>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    Showing top {traders.length} participants with minimum trade resolution
                </div>
            </div>

            <UpgradeModal 
                isOpen={isUpgradeModalOpen} 
                onClose={() => setIsUpgradeModalOpen(false)} 
            />
        </div>
    );
};

export default Leaderboard;
