import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Target, Shield, Clock, ExternalLink, ChevronDown, ChevronUp, Zap, Activity, AlertCircle, Sparkles } from 'lucide-react';
import Sparkline from '../components/Sparkline';
import RiskMeter from '../components/RiskMeter';
import { AuthContext } from '../context/AuthContext';

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
                    <div className="flex flex-col items-end group">
                        <div className="flex items-center gap-1">
                            <span style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '0.9rem', lineHeight: 1 }}>{Math.round(trader.whale_score || 0)}</span>
                            {trader.tags?.includes('most_copied') && (
                                <Zap size={10} className="text-accent animate-pulse" />
                            )}
                        </div>
                        <span style={{ fontSize: '0.5rem', fontWeight: '800', opacity: 0.4, marginTop: '2px' }}>WHALE SCORE</span>
                    </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div className="flex flex-col items-end bg-success/5 p-1 rounded-sm border border-success/10">
                        <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--success)', lineHeight: 1 }}>
                            {trader.adjusted_roi ? `${trader.adjusted_roi.toFixed(1)}%` : '0%'}
                        </span>
                        <span style={{ fontSize: '0.45rem', opacity: 0.6, fontWeight: '900', marginTop: '2px', textTransform: 'uppercase' }}>Alpha ROI</span>
                    </div>
                </td>
                <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div className="flex flex-col items-end opacity-80">
                        <span style={{ fontWeight: '600', fontSize: '0.75rem', lineHeight: 1 }}>
                            {trader.win_rate ? `${(trader.win_rate * 100).toFixed(0)}%` : '0%'}
                        </span>
                        <span style={{ fontSize: '0.45rem', opacity: 0.5, fontWeight: '800', marginTop: '2px' }}>WIN RATE</span>
                    </div>
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
                            className="btn-outline hover-glow font-black uppercase tracking-widest" 
                            style={{ 
                                padding: '0.2rem 0.6rem', 
                                fontSize: '0.55rem', 
                                background: 'rgba(59, 130, 246, 0.1)', 
                                borderColor: 'var(--primary)', 
                                borderRadius: '4px',
                                color: 'var(--primary)'
                            }}
                        >
                            Start Copying
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '3rem' }}>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-tighter text-muted font-black mb-1 opacity-40">Total Volume</span>
                                        <span className="text-xs font-mono font-bold text-white/90 leading-none">{formatCurrency(trader.volume)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-tighter text-muted font-black mb-1 opacity-40">Realized PNL</span>
                                        <span className="text-xs font-mono font-bold leading-none" style={{ color: trader.pnl >= 0 ? '#10B981' : '#EF4444' }}>{formatCurrency(trader.pnl)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-tighter text-muted font-black mb-1 opacity-40">Signal Confidence</span>
                                        <div className="flex items-center gap-1.5 leading-none">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_var(--primary)]"></div>
                                            <span className="text-xs font-black text-primary uppercase tracking-widest">Ultra High</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="glass-panel p-4 border-success/20 relative overflow-hidden group/forecast min-w-[200px]">
                                    <div className="absolute -right-2 -top-2 opacity-5 group-hover/forecast:opacity-10 transition-opacity">
                                        <TrendingUp size={60} />
                                    </div>
                                    <p className="text-[9px] font-black text-success uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                                        <Zap size={10} /> Projected Weekly
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <h4 className="text-2xl font-black text-white">{formatCurrency(forecastAmount)}</h4>
                                        <span className="text-success text-[10px] font-black tracking-widest">EST. PROFIT</span>
                                    </div>
                                    <p className="text-[8px] text-muted/60 mt-2 italic font-medium leading-tight">
                                        Standard $1,000 allocation basis.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 min-w-[180px]">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onMirror(trader); }}
                                        className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.25em] text-[10px] rounded border border-primary/50 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        [ Start Copying Now ]
                                    </button>
                                    <div className="flex items-center justify-center gap-2 opacity-30">
                                        <Shield size={10} />
                                        <span className="text-[8px] font-black uppercase tracking-widest leading-none">WhaleSync Institutional Guard</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const Leaderboard = () => {
    const { user } = React.useContext(AuthContext);
    const [traders, setTraders] = useState([]);
    const [archetypes, setArchetypes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [archLoading, setArchLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('WEEK');
    const [sortBy, setSortBy] = useState('SCORE');
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [mirroringStatus, setMirroringStatus] = useState(null);
    const navigate = React.useMemo(() => (path) => window.location.href = path, []);

    const handleMirror = async (trader) => {
        if (!user) {
            alert("Please login to start copying traders.");
            return;
        }
        
        setMirroringStatus('Initializing...');
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/strategies/mirror?user_id=${user.userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: trader.address,
                    username: trader.username || 'Anonymous',
                    risk_mode: 'Balanced'
                })
            });

            if (res.status === 403) {
                const data = await res.json();
                if (data.detail === "SLOTS_FULL") {
                    setIsUpgradeModalOpen(true);
                    setMirroringStatus(null);
                    return;
                }
            } else if (!res.ok) {
                const data = await res.json();
                alert(`Error: ${JSON.stringify(data)}`);
                setMirroringStatus(null);
                return;
            }

            setMirroringStatus('Success!');
            // Brief delay to show success before redirect
            setTimeout(() => {
                navigate('/simulator');
            }, 800);
            
        } catch (err) {
            console.error("Mirror error:", err);
            alert("Failed to start copying trader. Please try again.");
            setMirroringStatus(null);
        }
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
            } catch (err) {
                console.error("Archetypes fetch failed:", err);
            } finally {
                setArchLoading(false);
            }
        };
        fetchArchetypes();
    }, []);

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                {/* 1. 🏆 Top Trader Today */}
                <div className="glass-panel-unified relative overflow-hidden group hover:border-primary/50 transition-all duration-500 flex flex-col justify-between" style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
                        <Award size={32} className="text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] px-1.5 py-0.5 bg-primary/10 rounded-sm border border-primary/20">🏆 TOP WHALE TODAY</span>
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[8px] font-black text-primary uppercase">LIVE</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner overflow-hidden">
                                {archetypes?.top_whale?.profile_image ? (
                                    <img src={archetypes.top_whale.profile_image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-black text-primary">{(archetypes?.top_whale?.username?.[0] || 'W').toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white leading-none tracking-tight">@{archetypes?.top_whale?.username || 'Loading...'}</h4>
                                <div className="text-[8px] font-bold text-muted uppercase tracking-[0.1em] opacity-40">RANK #1 GLOBAL</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 mb-3">
                            <div className="p-1 px-1.5 bg-white/5 rounded-md border border-white/5">
                                <div className="text-[6px] font-bold text-muted uppercase tracking-widest mb-0.5 opacity-60">SCORE</div>
                                <div className="text-[10px] font-black text-white">{Math.round(archetypes?.top_whale?.whale_score || 0)}</div>
                            </div>
                            <div className="p-1 px-1.5 bg-white/5 rounded-md border border-white/5">
                                <div className="text-[6px] font-bold text-muted uppercase tracking-widest mb-0.5 opacity-60">ROI</div>
                                <div className="text-[10px] font-black text-profit">{(archetypes?.top_whale?.roi || 0).toFixed(1)}%</div>
                            </div>
                            <div className="p-1 px-1.5 bg-white/5 rounded-md border border-white/5">
                                <div className="text-[6px] font-bold text-muted uppercase tracking-widest mb-0.5 opacity-60">WIN %</div>
                                <div className="text-[10px] font-black text-white">{(archetypes?.top_whale?.win_rate * 100 || 0).toFixed(0)}%</div>
                            </div>
                        </div>
                    </div>
                    <button 
                        disabled={archLoading}
                        onClick={() => handleMirror(archetypes?.top_whale)}
                        className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-[9px] font-black uppercase tracking-[0.2em] rounded border border-primary/50 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {mirroringStatus || 'Start Copying'}
                    </button>
                </div>

                {/* 2. 📈 Best Risk-Adjustive Alpha */}
                <div className="glass-panel-unified hover:border-success/40 transition-all duration-300 flex flex-col justify-between" style={{ padding: '1rem', border: '1px solid rgba(34, 197, 94, 0.15)', background: 'rgba(34, 197, 94, 0.02)' }}>
                    <div>
                        <div className="flex items-center gap-1.5 mb-3">
                            <TrendingUp size={12} className="text-success" />
                            <h4 className="text-[9px] font-black text-muted uppercase tracking-[0.15em]">📈 RISK-ADJUSTIVE</h4>
                        </div>
                        <div className="text-xl font-black text-white tracking-tighter mb-0.5">
                            {archetypes?.risk_adjusted?.adjusted_roi?.toFixed(1) || '0.0'}% <span className="text-[10px] text-success">ROI</span>
                        </div>
                        <div className="text-[8px] font-black text-success uppercase tracking-widest mb-4 opacity-80 flex items-center gap-1">
                            <Shield size={8} /> Institutional Grade
                        </div>
                        <div className="p-2 bg-success/5 rounded border border-success/10 mb-4">
                            <div className="text-[7px] font-black text-success/60 uppercase tracking-widest mb-1">Expected Profit / Week</div>
                            <div className="text-sm font-black text-white">{formatCurrency((1000 * (archetypes?.risk_adjusted?.adjusted_roi || 0) * 0.15) / 100)}</div>
                        </div>
                    </div>
                    <button 
                        disabled={archLoading}
                        onClick={() => handleMirror(archetypes?.risk_adjusted)}
                        className="w-full py-2.5 bg-success/10 hover:bg-success/20 text-success text-[9px] font-black uppercase tracking-[0.15em] rounded border border-success/30 transition-all"
                    >
                        Start Copying
                    </button>
                </div>

                {/* 3. 🛡 Safest Profitable */}
                <div className="glass-panel-unified hover:border-accent/40 transition-all duration-300 flex flex-col justify-between" style={{ padding: '1rem', border: '1px solid rgba(246, 173, 85, 0.15)', background: 'rgba(246, 173, 85, 0.02)' }}>
                    <div>
                        <div className="flex items-center gap-1.5 mb-3">
                            <Shield size={12} className="text-accent" />
                            <h4 className="text-[9px] font-black text-muted uppercase tracking-[0.15em]">🛡 SAFEST ALPHA</h4>
                        </div>
                        <div className="text-xl font-black text-white tracking-tighter mb-0.5">
                            {archetypes?.safest?.roi?.toFixed(1) || '0.0'}% <span className="text-[10px] text-accent">ROI</span>
                        </div>
                        <div className="text-[8px] font-black text-accent uppercase tracking-widest mb-4 opacity-80 flex items-center gap-1">
                            <Zap size={8} /> Conservative Growth
                        </div>
                        <div className="p-2 bg-accent/5 rounded border border-accent/10 mb-4">
                            <div className="text-[7px] font-black text-accent/60 uppercase tracking-widest mb-1">Risk-Aware Profit / Week</div>
                            <div className="text-sm font-black text-white">{formatCurrency((1000 * (archetypes?.safest?.roi || 0) * 0.1) / 100)}</div>
                        </div>
                    </div>
                    <button 
                        disabled={archLoading}
                        onClick={() => handleMirror(archetypes?.safest)}
                        className="w-full py-2.5 bg-accent/10 hover:bg-accent/20 text-accent text-[9px] font-black uppercase tracking-[0.15em] rounded border border-accent/30 transition-all"
                    >
                        Start Copying
                    </button>
                </div>

                {/* 4. 🔥 Most Copied */}
                <div className="glass-panel-unified hover:border-danger/40 transition-all duration-300 relative overflow-hidden flex flex-col justify-between" style={{ padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.15)', background: 'rgba(239, 68, 68, 0.02)' }}>
                    <div className="absolute -right-2 -top-2 w-12 h-12 bg-danger/5 blur-xl rounded-full" />
                    <div>
                        <div className="flex items-center gap-1.5 mb-3">
                            <Activity size={12} className="text-danger" />
                            <h4 className="text-[9px] font-black text-muted uppercase tracking-[0.15em]">🔥 MOST COPIED</h4>
                        </div>
                        <div className="text-xl font-black text-white tracking-tighter mb-0.5">
                            {archetypes?.most_copied?.mock_copiers?.toLocaleString() || '1,204'} <span className="text-[10px] text-danger">COPIES</span>
                        </div>
                        <div className="text-[8px] font-black text-danger uppercase tracking-widest mb-4 opacity-80 flex items-center gap-1">
                            <Sparkles size={8} /> Social Consensus
                        </div>
                        <div className="flex items-end justify-between px-1 mb-4">
                            <div>
                                <div className="text-[6px] font-black text-muted uppercase tracking-widest">Global Vol.</div>
                                <div className="text-[9px] font-bold text-white/80">{formatCurrency(archetypes?.most_copied?.volume / 10 || 45000)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[6px] font-black text-muted uppercase tracking-widest">Confidence</div>
                                <div className="text-[9px] font-bold text-profit">98.4%</div>
                            </div>
                        </div>
                    </div>
                    <button 
                        disabled={archLoading}
                        onClick={() => handleMirror(archetypes?.most_copied)}
                        className="w-full py-2.5 bg-danger/10 hover:bg-danger/20 text-danger text-[9px] font-black uppercase tracking-[0.15em] rounded border border-danger/30 transition-all"
                    >
                        Start Copying
                    </button>
                </div>

                {/* 5. ⚡ Trending Now */}
                <div className="glass-panel-unified hover:border-primary/40 transition-all duration-500 relative overflow-hidden flex flex-col justify-between" style={{ padding: '1rem', border: '1px solid rgba(59, 130, 246, 0.15)', background: 'rgba(59, 130, 246, 0.02)' }}>
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/10 blur-2xl rounded-full" />
                    <div>
                        <div className="flex items-center gap-1.5 mb-3">
                            <Zap size={12} className="text-primary" fill="currentColor" />
                            <h4 className="text-[9px] font-black text-muted uppercase tracking-[0.15em]">⚡ TRENDING NOW</h4>
                        </div>
                        <div className="text-xl font-black text-profit tracking-tighter mb-0.5">
                            +{archetypes?.trending?.roi?.toFixed(1) || '0.0'}% <span className="text-[10px] text-profit">SPIKE</span>
                        </div>
                        <div className="text-[8px] font-black text-primary uppercase tracking-widest mb-4 opacity-80 flex items-center gap-1">
                            <Activity size={8} /> Velocity Breakout
                        </div>
                        <div className="p-2 bg-primary/5 rounded border border-primary/10 mb-4">
                            <div className="text-[7px] font-black text-primary/60 uppercase tracking-widest mb-1">Momentum Signal</div>
                            <div className="text-[10px] font-black text-white italic">Strong Inflow Detected</div>
                        </div>
                    </div>
                    <button 
                        disabled={archLoading}
                        onClick={() => handleMirror(archetypes?.trending)}
                        className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.15em] rounded border border-primary/30 transition-all"
                    >
                        Start Copying
                    </button>
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
