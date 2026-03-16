import React, { useState, useEffect, useContext } from 'react';
import { PortfolioContext } from '../context/PortfolioContext';
import { TrendingUp, Activity, DollarSign, ArrowUpRight, ArrowDownRight, UserPlus } from 'lucide-react';

const Dashboard = () => {
    const { portfolio, addSource, purchaseSlot } = useContext(PortfolioContext);
    const [signals, setSignals] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeTab, setActiveTab] = useState('Polymarket');
    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        // Fetch consensus signals
        fetch(`${apiUrl}/api/signals/`)
            .then(res => res.json())
            .then(data => setSignals(data.signals || []))
            .catch(err => console.error(err));

        // Fetch daily leaderboard
        setIsLoadingLeaderboard(true);
        fetch(`${apiUrl}/api/markets/leaderboard/?limit=10`)
            .then(res => res.json())
            .then(data => {
                setLeaderboard(data.leaderboard || []);
                setIsLoadingLeaderboard(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoadingLeaderboard(false);
            });
    }, []);

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
        <div className="container mt-4 animate-fade-in" style={{ padding: '2rem 1rem', position: 'relative' }}>

            {/* Notification Popup */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '1.5rem',
                    right: '1.5rem',
                    zIndex: 1000,
                    padding: '0.6rem 1rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    maxWidth: '400px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                    background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.98)' : 'rgba(239, 68, 68, 0.98)',
                    color: 'white',
                    animation: 'slideIn 0.3s ease-out',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: '0.85rem'
                }}>
                    <span style={{ fontWeight: 500, flex: 1 }}>{notification.message}</span>

                    {notification.isLimitError && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                purchaseSlot();
                            }}
                            className="btn-primary"
                            style={{
                                padding: '0.3rem 0.8rem',
                                fontSize: '0.75rem',
                                background: 'white',
                                color: 'var(--danger)',
                                fontWeight: 'bold',
                                border: 'none',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Buy Slot
                        </button>
                    )}

                    <button
                        onClick={() => setNotification(null)}
                        style={{
                            background: 'rgba(0,0,0,0.15)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            padding: 0,
                            flexShrink: 0,
                            lineHeight: 1
                        }}
                    >
                        &times;
                    </button>
                    <style>{`
                        @keyframes slideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `}</style>
                </div>
            )}

            {/* Top Stats Row - Responsive Grid */}
            <div className="stats-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '1.5rem', 
                marginBottom: '2rem' 
            }}>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-muted text-sm font-medium">Linked Wallet Portfolio</span>
                        <DollarSign size={20} className="text-primary" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        ${portfolio.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-muted text-sm font-medium">Simulated PnL</span>
                        <TrendingUp size={20} className="text-success" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: portfolio.total_pnl >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                        {portfolio.total_pnl >= 0 ? '+' : ''}${portfolio.total_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-muted text-sm font-medium">Open Positions</span>
                        <Activity size={20} className="text-primary" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {portfolio.open_positions?.length || 0}
                    </div>
                </div>
            </div>

            <div className="dashboard-content" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '2rem' 
            }}>
                {/* Left Column: Leaderboard */}
                <div className="flex-col gap-6" style={{ display: 'flex' }}>

                    {/* Platform Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        {['Polymarket', 'Kalshi', 'Manifold'].map(platform => (
                            <button
                                key={platform}
                                onClick={() => platform === 'Polymarket' && setActiveTab(platform)}
                                className={activeTab === platform ? 'btn-primary' : 'btn-outline'}
                                style={{
                                    padding: '0.5rem 1.5rem',
                                    opacity: platform === 'Polymarket' ? 1 : 0.4,
                                    cursor: platform === 'Polymarket' ? 'pointer' : 'not-allowed',
                                    fontSize: '0.9rem',
                                    background: activeTab === platform ? 'var(--primary)' : 'transparent',
                                    border: activeTab === platform ? 'none' : '1px solid var(--border)'
                                }}
                            >
                                {platform} {platform !== 'Polymarket' && '(Soon)'}
                            </button>
                        ))}
                    </div>

                    {/* Leaderboard Section */}
                    <section className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div className="flex justify-between items-center mb-6">
                            <a 
                                href="https://polymarket.com/leaderboard/overall/today/profit" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover-text-primary"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <TrendingUp className="text-primary" size={20} /> Today's Top Earners (PnL) <ArrowUpRight size={16} style={{ opacity: 0.6 }} />
                                </h3>
                            </a>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '0.75rem' }}>Rank</th>
                                        <th style={{ padding: '0.75rem' }}>Trader</th>
                                        <th style={{ padding: '0.75rem' }}>Address</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Daily PnL (Realized/UTC)</th>
                                        <th style={{ padding: '0.75rem' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingLeaderboard ? (
                                        <tr><td colSpan="5" className="text-center py-8 italic text-muted">Loading leaderboard data...</td></tr>
                                    ) : leaderboard.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-8 italic text-muted">No leaderboard data found.</td></tr>
                                    ) : leaderboard.map((trader, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.9rem', transition: 'background 0.2s' }} className="hover-row">
                                            <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>#{idx + 1}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div className="flex items-center gap-3">
                                                    {trader.profileImage ? (
                                                        <img src={trader.profileImage} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
                                                    ) : (
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{trader.userName?.charAt(0) || 'T'}</div>
                                                    )}
                                                    <span style={{ fontWeight: 500 }}>{trader.userName || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <a
                                                    href={`https://polymarket.com/profile/${trader.proxyWallet}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: '0.75rem', color: 'var(--primary)', opacity: 0.8 }}
                                                >
                                                    {trader.proxyWallet.substring(0, 6)}...{trader.proxyWallet.substring(38)}
                                                </a>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent)' }}>
                                                +${parseFloat(trader.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <button
                                                    className="btn-outline"
                                                    style={{ padding: '0.2rem 0.8rem', fontSize: '0.75rem' }}
                                                    onClick={() => handleFollow(trader)}
                                                >
                                                    Follow
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ marginTop: '1rem', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', opacity: 0.7 }}>
                            <p style={{ margin: 0 }}>
                                <strong>Note:</strong> Leaderboard rankings are based on official Polymarket <strong>Realized PnL</strong> for the current UTC day.
                                Figures on individual profile charts may differ as they often include unrealized gains and use rolling 24-hour windows.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Right Column: Signals Placeholder */}
                <div>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6 }}>
                        <TrendingUp size={20} className="text-primary" /> Live Signals
                    </h3>
                    <div className="glass-panel" style={{
                        height: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        padding: '2rem',
                        textAlign: 'center',
                        background: 'rgba(30, 41, 59, 0.4)',
                        borderStyle: 'dashed',
                        borderWidth: '2px'
                    }}>
                        <Activity size={48} className="text-primary" style={{ opacity: 0.3 }} />
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Coming Soon</h4>
                            <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.6' }}>
                                Real-time AI-driven consensus signals and market sentiment analysis are currently under beta testing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
