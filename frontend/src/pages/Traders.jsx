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
                
                <div className="flex gap-2">
                    {['DAY', 'WEEK', 'MONTH', 'ALL'].map(tf => (
                        <button 
                            key={tf}
                            className={`btn-outline ${timeframe === tf ? 'active' : ''}`}
                            style={{ 
                                padding: '0.4rem 1rem', 
                                fontSize: '0.75rem',
                                borderColor: timeframe === tf ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                background: timeframe === tf ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                            }}
                            onClick={() => setTimeframe(tf)}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(0,0,0,0) 100%)' }}>
                    <TrendingUp className="text-primary mb-3" />
                    <h4 className="text-muted uppercase text-xs font-bold tracking-wider mb-1">Top ROI</h4>
                    <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>145.2%</p>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(0,0,0,0) 100%)' }}>
                    <Target className="text-success mb-3" />
                    <h4 className="text-muted uppercase text-xs font-bold tracking-wider mb-1">Highest Accuracy</h4>
                    <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>89.4%</p>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(0,0,0,0) 100%)' }}>
                    <Shield className="text-accent mb-3" />
                    <h4 className="text-muted uppercase text-xs font-bold tracking-wider mb-1">Best Risk Score</h4>
                    <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>1.2</p>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
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
                                <tr key={trader.address || idx} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
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
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div className="flex items-center gap-3">
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
                                                {trader.username ? trader.username[0].toUpperCase() : (trader.address ? trader.address[0].toUpperCase() : 'W')}
                                            </div>
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
                                        <button className="btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>
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
