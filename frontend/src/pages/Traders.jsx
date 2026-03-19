import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Target, Shield, Clock, ExternalLink } from 'lucide-react';

const Leaderboard = () => {
    const [traders, setTraders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('ALL');
    const [sortBy, setSortBy] = useState('PNL');

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
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                        Global <span className="text-primary">Leaderboard</span>
                    </h1>
                    <p className="text-muted">Tracking the highest performance prediction market participants.</p>
                </div>
                
                <div className="flex gap-1.5">
                    {['DAY', 'WEEK', 'MONTH', 'ALL'].map(tf => (
                        <button 
                            key={tf}
                            className={`btn-outline ${timeframe === tf ? 'active' : ''}`}
                            style={{ 
                                padding: '0.2rem 0.5rem', 
                                fontSize: '0.6rem',
                                minWidth: '50px',
                                borderColor: timeframe === tf ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                                background: timeframe === tf ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                borderRadius: '4px',
                                fontWeight: '700'
                            }}
                            onClick={() => setTimeframe(tf)}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                <div className="glass-panel animate-fade-in stagger-1" style={{ padding: '0.75rem 1rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(0,0,0,0) 100%)' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-primary" />
                        <h4 className="text-muted uppercase text-[9px] font-bold tracking-widest">TOP {timeframe} ROI</h4>
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: '900', color: 'white' }}>
                        {traders.length > 0 ? `${Math.max(...traders.map(t => t.roi || 0)).toFixed(1)}%` : '0.0%'}
                    </p>
                </div>
                
                <div className="glass-panel animate-fade-in stagger-2" style={{ padding: '0.75rem 1rem', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(0,0,0,0) 100%)' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Target size={14} className="text-success" />
                        <h4 className="text-muted uppercase text-[9px] font-bold tracking-widest">AVG ACCURACY</h4>
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: '900', color: 'white' }}>
                        {traders.length > 0 ? `${(traders.reduce((acc, t) => acc + (t.win_rate || 0), 0) / traders.length * 100).toFixed(1)}%` : '0.0%'}
                    </p>
                </div>

                <div className="glass-panel animate-fade-in stagger-3" style={{ padding: '0.75rem 1rem', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(0,0,0,0) 100%)' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Shield size={14} className="text-accent" />
                        <h4 className="text-muted uppercase text-[9px] font-bold tracking-widest">TOTAL VOLUME</h4>
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: '900', color: 'white' }}>
                        {formatCurrency(traders.reduce((acc, t) => acc + (t.volume || 0), 0))}
                    </p>
                </div>
            </div>

            <div className="glass-panel w-full" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <th style={{ padding: '1.25rem', textAlign: 'left', fontWeight: '800' }}>RANK</th>
                                <th style={{ padding: '1.25rem', textAlign: 'left', fontWeight: '800' }}>TRADER</th>
                                <th 
                                    style={{ padding: '1.25rem', textAlign: 'right', fontWeight: '800', cursor: 'pointer', color: sortBy === 'PNL' ? 'var(--primary)' : 'inherit' }}
                                    onClick={() => setSortBy('PNL')}
                                >
                                    PNL {sortBy === 'PNL' && '↓'}
                                </th>
                                <th 
                                    style={{ padding: '1.25rem', textAlign: 'right', fontWeight: '800', cursor: 'pointer', color: sortBy === 'ROI' ? 'var(--primary)' : 'inherit' }}
                                    onClick={() => setSortBy('ROI')}
                                >
                                    ROI {sortBy === 'ROI' && '↓'}
                                </th>
                                <th 
                                    style={{ padding: '1.25rem', textAlign: 'right', fontWeight: '800', cursor: 'pointer', color: sortBy === 'WIN_RATE' ? 'var(--primary)' : 'inherit' }}
                                    onClick={() => setSortBy('WIN_RATE')}
                                >
                                    ACCURACY {sortBy === 'WIN_RATE' && '↓'}
                                </th>
                                <th style={{ padding: '1.25rem', textAlign: 'right', fontWeight: '800' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>
                                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                                        <p className="text-muted mt-4">Syncing with prediction markets...</p>
                                    </td>
                                </tr>
                            ) : traders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>
                                        <p className="text-muted">No data available for this timeframe.</p>
                                    </td>
                                </tr>
                            ) : (
                                traders.map((trader, idx) => (
                                    <tr 
                                        key={trader.address || idx} 
                                        className={`table-row-hover animate-fade-in stagger-${(idx % 5) + 1}`} 
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                    >
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ 
                                                width: '24px', 
                                                height: '24px', 
                                                borderRadius: '50%', 
                                                background: idx < 3 ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                color: idx < 3 ? 'white' : 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.7rem',
                                                fontWeight: '800'
                                            }}>
                                                {trader.rank || idx + 1}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div className="flex items-center gap-3">
                                                {trader.profile_image ? (
                                                    <img src={trader.profile_image} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                ) : (
                                                    <div style={{ 
                                                        width: '32px', 
                                                        height: '32px', 
                                                        borderRadius: '50%', 
                                                        background: 'linear-gradient(45deg, var(--primary), var(--accent))',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {trader.username ? trader.username[0].toUpperCase() : 'W'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: '700' }}>{trader.username || 'Anonymous Whale'}</p>
                                                    <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.5 }}>{trader.address ? `${trader.address.slice(0, 6)}...${trader.address.slice(-4)}` : '0x...'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: '700', color: (trader.pnl || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                            {formatCurrency(trader.pnl)}
                                        </td>
                                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: '600' }}>
                                            {trader.roi ? `${trader.roi.toFixed(1)}%` : '0%'}
                                        </td>
                                        <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: '600' }}>
                                            {trader.win_rate ? `${(trader.win_rate * 100).toFixed(1)}%` : '0%'}
                                        </td>
                                        <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                            <button className="btn-outline hover-glow" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', background: 'rgba(255,255,255,0.02)' }}>
                                                Mirror
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs text-muted">
                <Clock size={12} />
                <span>Last updated 4 minutes ago. Data synced via Gamma CLOB API.</span>
                <span style={{ marginLeft: 'auto' }}>Showing top {traders.length} participants</span>
            </div>
        </div>
    );
};

export default Leaderboard;
