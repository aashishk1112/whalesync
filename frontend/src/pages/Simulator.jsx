import React, { useState, useEffect, useContext, useRef } from 'react';
import { Play, Square, Settings, Activity, ChevronDown, Check, X } from 'lucide-react';
import { PortfolioContext } from '../context/PortfolioContext';
import { AuthContext } from '../context/AuthContext';

const Simulator = () => {
    const { user } = useContext(AuthContext);
    const { portfolio, settings, refreshPortfolio } = useContext(PortfolioContext);
    const [strategies, setStrategies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newStrat, setNewStrat] = useState({
        name: '',
        platform: 'Polymarket',
        allocation: 10,
        betSizePercentage: 5, // Default 5% per trade
        selectedSources: [],
        category: 'All',
        isLive: false
    });

    useEffect(() => {
        if (!user) return;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

        const fetchData = () => {
            fetch(`${apiUrl}/api/strategies/?user_id=${user.user_id}`)
                .then(res => res.json())
                .then(data => setStrategies(data.strategies || []))
                .catch(err => console.error(err));

            // Also refresh global portfolio to catch automated trades
            refreshPortfolio();
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, [user, refreshPortfolio]);

    useEffect(() => {
        if (!user) return;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

        const fetchCategories = () => {
            fetch(`${apiUrl}/api/markets/categories?platform=${newStrat.platform}`)
                .then(res => res.json())
                .then(data => {
                    console.log(`Fetched categories for ${newStrat.platform}:`, data);
                    setCategories(data.categories || []);
                })
                .catch(err => console.error(err));
        };

        fetchCategories();
    }, [user, newStrat.platform]);

    const [error, setError] = useState('');

    // Auto-clear error after 10 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');

        const allocation = parseFloat(newStrat.allocation);
        if (isNaN(allocation) || allocation < 5 || allocation > 100) {
            setError("Allocation must be between 5% and 100%");
            return;
        }

        const totalExisting = strategies
            .filter(s => s.status === 'active' || s.status === 'paused' || s.status === 'stopped')
            .reduce((sum, s) => sum + parseFloat(s.allocation_percentage || 0), 0);

        if (totalExisting + allocation > 100) {
            setError(`Remaining budget is ${100 - totalExisting}%. Your request for ${allocation}% exceeds this.`);
            return;
        }
        if (!newStrat.name) {
            setError("Strategy name is required");
            return;
        }

        if (newStrat.selectedSources.length === 0) {
            setError("At least one source must be selected");
            return;
        }

        const payload = {
            name: newStrat.name,
            platform: newStrat.platform,
            allocation_percentage: allocation,
            bet_size_percentage: parseFloat(newStrat.betSizePercentage) || 5.0,
            source_addresses: newStrat.selectedSources,
            category: newStrat.category,
            is_live: newStrat.isLive
        };

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/strategies/?user_id=${user.user_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                setStrategies([...strategies, data.strategy]);
                setNewStrat({ name: '', platform: 'Polymarket', allocation: 10, betSizePercentage: 5, selectedSources: [], category: 'All', isLive: false });
                // Refresh portfolio immediately to show the initial simulation trade
                refreshPortfolio();
            } else {
                setError(data.detail || "Failed to deploy strategy");
            }
        } catch (err) {
            console.error(err);
            setError("Network error. Please try again.");
        }
    };

    const toggleStrategy = async (stratId, currentStatus) => {
        const action = currentStatus === 'active' ? 'stop' : 'resume';
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/strategies/${stratId}/${action}?user_id=${user.user_id}`, {
                method: 'POST'
            });
            if (res.ok) {
                setStrategies(prev => prev.map(s => s.strategy_id === stratId ? { ...s, status: currentStatus === 'active' ? 'stopped' : 'active' } : s));
            }
        } catch (err) { console.error(err); }
    };

    const removeStrategy = async (stratId) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/strategies/${stratId}?user_id=${user.user_id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setStrategies(prev => prev.filter(s => s.strategy_id !== stratId));
            }
        } catch (err) { console.error(err); }
    };

    const toggleSourceSelection = (address) => {
        setNewStrat(prev => ({
            ...prev,
            selectedSources: prev.selectedSources.includes(address)
                ? prev.selectedSources.filter(a => a !== address)
                : [...prev.selectedSources, address]
        }));
    };

    const SourceMultiselect = ({ platform, selected, onToggle }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);
        const availableSources = settings.copy_sources.filter(s => s.active && s.platform === platform);

        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        return (
            <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="glass-panel"
                    style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: '45px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px'
                    }}
                >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {selected.length === 0 ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Select sources...</span>
                        ) : (
                            selected.map(addr => {
                                const src = availableSources.find(s => s.address === addr);
                                return (
                                    <div key={addr} style={{
                                        background: 'rgba(59, 130, 246, 0.2)',
                                        color: 'var(--primary)',
                                        padding: '0.1rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        border: '1px solid rgba(59, 130, 246, 0.3)'
                                    }}>
                                        {src?.name || (addr || '').substring(0, 6)}
                                        <X size={12} onClick={(e) => { e.stopPropagation(); onToggle(addr); }} style={{ cursor: 'pointer' }} />
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <ChevronDown size={18} className="text-muted" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>

                {isOpen && (
                    <div
                        className="glass-panel"
                        style={{
                            position: 'absolute',
                            top: '110%',
                            left: 0,
                            right: 0,
                            zIndex: 100,
                            maxHeight: '250px',
                            overflowY: 'auto',
                            padding: '0.5rem',
                            background: 'var(--bg-dark)',
                            border: '1px solid var(--border)'
                        }}
                    >
                        {availableSources.length === 0 ? (
                            <div className="text-center py-4 text-xs text-muted">No active {platform} sources.</div>
                        ) : (
                            availableSources.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => onToggle(s.address)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        background: selected.includes(s.address) ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = selected.includes(s.address) ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}
                                >
                                    <div style={{ position: 'relative' }}>
                                        {s.image_url ? (
                                            <img src={s.image_url} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt={s.name} />
                                        ) : (
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                                {s.name.charAt(0)}
                                            </div>
                                        )}
                                        {selected.includes(s.address) && (
                                            <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--accent)', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-dark)' }}>
                                                <Check size={10} color="white" />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{s.name}</div>
                                        <div className="text-xs text-muted">{(s.address || '').substring(0, 10)}...</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    };

    const [selectedStratTrades, setSelectedStratTrades] = useState(null);
    const [isLoadingTrades, setIsLoadingTrades] = useState(false);

    const viewTrades = async (stratId) => {
        setIsLoadingTrades(true);
        setSelectedStratTrades([]); // Reset
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/strategies/${stratId}/trades`);
            const data = await res.json();
            if (res.ok) {
                setSelectedStratTrades(data.trades || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingTrades(false);
        }
    };

    return (
        <div className="container mt-4 animate-fade-in" style={{ padding: '2rem 1rem' }}>
            <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Activity className="text-primary" size={28} /> Strategy Sandbox System
            </h2>

            <div className="flex gap-4 mb-8" style={{ flexWrap: 'wrap' }}>
                <div className="glass-panel" style={{ padding: '1rem 2rem', minWidth: '200px' }}>
                    <div className="text-muted text-xs font-bold uppercase mb-1">Simulator Portfolio Value</div>
                    <div
                        className="text-3xl font-bold"
                        style={{ color: portfolio.balance <= 0 ? 'var(--danger)' : 'var(--accent)' }}
                    >
                        ${portfolio.balance.toLocaleString()}
                    </div>
                </div>
                <div className="glass-panel" style={{ padding: '1rem 2rem', minWidth: '200px' }}>
                    <div className="text-muted text-xs font-bold uppercase mb-1">Active Strategies</div>
                    <div className="text-3xl font-bold">{strategies.filter(s => s.status === 'active').length}</div>
                </div>
            </div>

            {/* Trade History Modal */}
            {selectedStratTrades !== null && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="glass-panel" style={{
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '2rem',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setSelectedStratTrades(null)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h3 style={{ marginBottom: '1.5rem' }}>Strategy Trade History</h3>

                        <div style={{ overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '1rem 0.5rem' }}>Time</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Market ID</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Category</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Side</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Price</th>
                                        <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingTrades ? (
                                        <tr><td colSpan="5" className="text-center py-8 italic text-muted">Loading trades...</td></tr>
                                    ) : selectedStratTrades.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-8 italic text-muted">No trades recorded for this strategy.</td></tr>
                                    ) : selectedStratTrades.map((t, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.9rem' }}>
                                            <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>
                                                {new Date(t.created_at).toLocaleTimeString()}
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem' }}>{(t.market_id || '').substring(0, 10)}...</td>
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                                    {t.category || 'All'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                <span style={{
                                                    padding: '0.1rem 0.4rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    background: t.position === 'YES' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: t.position === 'YES' ? 'var(--accent)' : 'var(--danger)'
                                                }}>
                                                    {t.position}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem' }}>${parseFloat(t.price).toFixed(2)}</td>
                                            <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                                ${parseFloat(t.amount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="simulator-content" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '2rem' 
            }}>
                {/* Creation Panel */}
                <div className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={20} /> New Copy Strategy
                    </h3>
                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--danger)',
                            border: '1px solid var(--danger)',
                            fontSize: '0.8rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>{error}</span>
                            <button
                                onClick={() => setError('')}
                                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: '2px' }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted mb-1 block">Strategy Name</label>
                            <input
                                type="text"
                                value={newStrat.name}
                                onChange={e => setNewStrat({ ...newStrat, name: e.target.value })}
                                placeholder="e.g., Aggressive Polymarket Whales"
                                required
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="text-xs font-bold uppercase text-muted mb-1 block">Platform</label>
                                <select
                                    value={newStrat.platform}
                                    onChange={e => setNewStrat({ ...newStrat, platform: e.target.value, selectedSources: [] })}
                                >
                                    <option value="Polymarket">Polymarket</option>
                                    <option value="Kalshi" disabled>Kalshi (Soon)</option>
                                    <option value="Manifold" disabled>Manifold (Soon)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-muted mb-1 block">Trade Category</label>
                                <select
                                    value={newStrat.category}
                                    onChange={e => setNewStrat({ ...newStrat, category: e.target.value })}
                                >
                                    <option value="All">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted mb-1 block">Sources to Copy (Multiple)</label>
                            <SourceMultiselect
                                platform={newStrat.platform}
                                selected={newStrat.selectedSources}
                                onToggle={toggleSourceSelection}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted mb-1 block">
                                Portfolio Allocation %
                                <span style={{ float: 'right', fontWeight: 'normal', textTransform: 'none', opacity: 0.7 }}>
                                    Remaining: {(() => {
                                        const remaining = 100 - strategies.filter(s => s.status === 'active' || s.status === 'paused' || s.status === 'stopped').reduce((sum, s) => sum + parseFloat(s.allocation_percentage || 0), 0);
                                        return remaining;
                                    })()}% | Min: 5%
                                </span>
                            </label>
                            <input
                                type="number"
                                value={newStrat.allocation}
                                onChange={e => setNewStrat({ ...newStrat, allocation: e.target.value })}
                                min={5}
                                max={100}
                                step={1}
                                style={{
                                    borderColor: (() => {
                                        const alloc = parseFloat(newStrat.allocation);
                                        const totalExclNew = strategies.filter(s => s.status === 'active' || s.status === 'paused' || s.status === 'stopped').reduce((sum, s) => sum + parseFloat(s.allocation_percentage || 0), 0);
                                        const remaining = 100 - totalExclNew;
                                        if (isNaN(alloc) || alloc < 5 || alloc > 100 || alloc > remaining) return 'var(--danger)';
                                        return 'var(--border)';
                                    })()
                                }}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted mb-1 block">
                                Amount per Prediction (%)
                                <span style={{ float: 'right', fontWeight: 'normal', textTransform: 'none', opacity: 0.7 }}>
                                    Default: 5%
                                </span>
                            </label>
                            <input
                                type="number"
                                value={newStrat.betSizePercentage}
                                onChange={e => setNewStrat({ ...newStrat, betSizePercentage: e.target.value })}
                                min={1}
                                max={100}
                                step={1}
                            />
                            <p className="text-xs text-muted mt-1">% of strategy balance to use per trade.</p>
                        </div>
                        <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase">Use for Live</span>
                                <span className="text-xs text-muted">Execute real trades on Platform</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => settings.polymarket_address && setNewStrat({ ...newStrat, isLive: !newStrat.isLive })}
                                style={{
                                    width: '40px',
                                    height: '20px',
                                    borderRadius: '10px',
                                    background: newStrat.isLive ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                                    position: 'relative',
                                    cursor: settings.polymarket_address ? 'pointer' : 'not-allowed',
                                    padding: 0,
                                    border: 'none',
                                    opacity: settings.polymarket_address ? 1 : 0.5
                                }}
                            >
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    position: 'absolute',
                                    top: '2px',
                                    left: newStrat.isLive ? '22px' : '2px',
                                    transition: 'left 0.2s'
                                }} />
                            </button>
                        </div>
                        {(!settings.polymarket_address && newStrat.platform === 'Polymarket') && (
                            <p className="text-xs text-muted" style={{ color: 'var(--danger)', opacity: 0.8 }}>
                                * Connect Polymarket in Settings to enable Live mode.
                            </p>
                        )}
                        <button
                            className="btn-primary mt-4"
                            type="submit"
                            disabled={(() => {
                                const alloc = parseFloat(newStrat.allocation);
                                const totalExclNew = strategies.filter(s => s.status === 'active' || s.status === 'paused' || s.status === 'stopped').reduce((sum, s) => sum + parseFloat(s.allocation_percentage || 0), 0);
                                const remaining = 100 - totalExclNew;
                                return (
                                    remaining <= 0 ||
                                    isNaN(alloc) ||
                                    alloc < 5 ||
                                    alloc > 100 ||
                                    alloc > remaining ||
                                    newStrat.selectedSources.length === 0 ||
                                    !newStrat.name
                                );
                            })()}
                        >
                            Deploy Strategy
                        </button>
                    </form>
                </div>

                {/* Active Strategies Panel */}
                <div className="flex-col gap-4" style={{ display: 'flex' }}>
                    {strategies
                        .map((s, idx) => (
                            <div key={idx} className="glass-panel" style={{ padding: '1.5rem', borderLeft: s.status === 'active' ? '4px solid var(--accent)' : '4px solid var(--text-muted)' }}>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex flex-col">
                                        <h3 style={{ margin: 0 }}>{s.name}</h3>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>{s.category || 'All'} Strategy</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {s.is_live && (
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.65rem',
                                                fontWeight: 'bold',
                                                background: 'var(--danger)',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                <Activity size={10} /> LIVE
                                            </span>
                                        )}
                                        <button
                                            onClick={() => viewTrades(s.strategy_id)}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            View Trades
                                        </button>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            background: s.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                                            color: s.status === 'active' ? 'var(--accent)' : 'var(--text-muted)'
                                        }}>
                                            {s.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div className="text-muted text-sm">Sources</div>
                                        <div className="flex" style={{ flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                                            {s.source_addresses.map(addr => {
                                                const src = settings.copy_sources.find(cs => cs.address === addr);
                                                return src?.image_url ? (
                                                    <img
                                                        key={addr}
                                                        src={src.image_url}
                                                        title={src.name}
                                                        style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--primary)' }}
                                                    />
                                                ) : (
                                                    <div key={addr} title={src?.name || addr} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>
                                                        {(src?.name || '?').charAt(0)}
                                                    </div>
                                                );
                                            })}
                                            {s.source_addresses.length === 0 && <span className="text-xs text-muted">None</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted text-sm">Strategy Balance</div>
                                        <div style={{ fontWeight: 'bold', color: parseFloat(s.strategy_balance) <= 0 ? 'var(--danger)' : 'var(--text-main)' }}>
                                            ${parseFloat(s.strategy_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-xs text-muted">Sizing: {s.bet_size_percentage}%</div>
                                    </div>
                                    <div>
                                        <div className="text-muted text-sm">Strategy PnL</div>
                                        <div style={{ fontWeight: 'bold', color: s.simulated_pnl >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                                            ${parseFloat(s.simulated_pnl || 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {s.status === 'active' ? (
                                        <button className="btn-danger" onClick={() => toggleStrategy(s.strategy_id, 'active')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Square size={14} /> Stop
                                        </button>
                                    ) : (
                                        <button className="btn-success" onClick={() => toggleStrategy(s.strategy_id, 'stopped')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Play size={14} /> Resume
                                        </button>
                                    )}
                                    <button className="btn-outline" onClick={() => removeStrategy(s.strategy_id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.75rem' }}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}

                    {strategies.length === 0 && (
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No active simulator strategies. Create one to begin automated interaction.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Simulator;
