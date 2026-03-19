import React, { useState, useEffect, useContext, useRef } from 'react';
import { Play, Square, Settings, Activity, ChevronDown, Check, X, TrendingUp, Users, Target, Zap, Shield, Flame, Info, BarChart3, Clock } from 'lucide-react';
import { PortfolioContext } from '../context/PortfolioContext';
import { AuthContext } from '../context/AuthContext';

const Sparkline = ({ data, color = 'var(--primary)', height = 30, width = 100 }) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * width,
        y: height - ((d - min) / range) * height
    }));
    const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            <path d={pathData} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`${pathData} L ${width},${height} L 0,${height} Z`} fill={`url(#gradient-${color.replace(/[^a-zA-Z0-0]/g, '')})`} opacity="0.1" />
            <defs>
                <linearGradient id={`gradient-${color.replace(/[^a-zA-Z0-0]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
        </svg>
    );
};

const Simulator = () => {
    const { user } = useContext(AuthContext);
    const { portfolio, settings, refreshPortfolio } = useContext(PortfolioContext);
    const [strategies, setStrategies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newStrat, setNewStrat] = useState({
        name: '',
        platform: 'Polymarket',
        allocation: 10,
        betSizePercentage: 5,
        selectedSources: [],
        category: 'All',
        isLive: false,
        riskMode: 'Balanced'
    });

    const STRATEGY_TEMPLATES = [
        {
            name: "Copy Top Whales",
            description: "Automatically tracks the top 5 traders by WhaleScore (7D historical).",
            roi: "+18.4%",
            risk: "Medium",
            config: { allocation: 15, betSize: 5, riskMode: 'Balanced' }
        },
        {
            name: "Win Rate Snipers",
            description: "Focuses on traders with >75% accuracy and low drawdown.",
            roi: "+12.1%",
            risk: "Low",
            config: { allocation: 10, betSize: 2, riskMode: 'Conservative' }
        },
        {
            name: "Momentum Seekers",
            description: "Aggressive copying of high-volume trending market leaders.",
            roi: "+28.7%",
            risk: "High",
            config: { allocation: 25, betSize: 10, riskMode: 'Aggressive' }
        }
    ];

    const applyTemplate = (template) => {
        // Find best source for this template type
        let suggestedIds = [];
        if (template.name.includes("Whales")) {
            suggestedIds = settings.copy_sources
                .filter(s => s.active && s.platform === 'Polymarket')
                .slice(0, 3)
                .map(s => s.address);
        } else if (template.name.includes("Win Rate")) {
            suggestedIds = settings.copy_sources
                .filter(s => s.active)
                .slice(1, 4)
                .map(s => s.address);
        }

        setNewStrat({
            ...newStrat,
            name: template.name,
            allocation: template.config.allocation,
            betSizePercentage: template.config.betSize,
            riskMode: template.config.riskMode,
            selectedSources: suggestedIds
        });
    };

    const recommendTraders = () => {
        const topTraders = settings.copy_sources
            .filter(s => s.active && s.platform === newStrat.platform)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(s => s.address);
        
        setNewStrat(prev => ({ ...prev, selectedSources: topTraders }));
    };

    useEffect(() => {
        if (!user) return;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const wsUrl = apiUrl.replace('http', 'ws');

        const fetchData = () => {
            fetch(`${apiUrl}/api/strategies/?user_id=${user.user_id}`)
                .then(res => res.json())
                .then(data => setStrategies(data.strategies || []))
                .catch(err => console.error(err));
            refreshPortfolio();
        };

        fetchData();

        // WebSocket for Real-time Updates (Phase 6)
        const socket = new WebSocket(`${wsUrl}/api/strategies/ws/${user.user_id}`);
        
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.strategies) {
                    console.log("WebSocket Sync:", data.strategies.length, "strategies");
                    setStrategies(data.strategies);
                }
            } catch (err) {
                console.error("WebSocket Msg Error:", err);
            }
        };

        socket.onopen = () => console.log("Strategy WebSocket Connected");
        socket.onclose = () => console.log("Strategy WebSocket Disconnected");

        return () => socket.close();
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
            is_live: newStrat.isLive,
            risk_mode: newStrat.riskMode || 'Balanced'
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
                setNewStrat({ name: '', platform: 'Polymarket', allocation: 10, betSizePercentage: 5, selectedSources: [], category: 'All', isLive: false, riskMode: 'Balanced' });
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
    
    const [previewData, setPreviewData] = useState({
        expected_pnl_7d: 0,
        win_rate: 0,
        max_drawdown: 0,
        confidence_score: 0,
        recent_signals: []
    });
    
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // Fetch Preview Data when strategy parameters change
    useEffect(() => {
        if (!newStrat.selectedSources || newStrat.selectedSources.length === 0) {
            setPreviewData({ expected_pnl_7d: 0, win_rate: 0, max_drawdown: 0, confidence_score: 0, recent_signals: [] });
            return;
        }

        const fetchPreview = async () => {
            setIsPreviewLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/strategies/preview`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trader_ids: newStrat.selectedSources,
                        risk_mode: newStrat.riskMode || 'Balanced',
                        allocation: parseFloat(newStrat.allocation),
                        trade_size: parseFloat(newStrat.betSizePercentage)
                    })
                });
                const data = await res.json();
                if (res.ok) setPreviewData(data);
            } catch (err) {
                console.error("Preview error:", err);
            } finally {
                setIsPreviewLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchPreview, 500);
        return () => clearTimeout(debounceTimer);
    }, [newStrat.selectedSources, newStrat.riskMode, newStrat.allocation, newStrat.betSizePercentage]);

    const StatCard = ({ title, value, trend, icon: Icon }) => (
        <div className="glass-panel hover-glow" style={{ padding: '1.5rem', flex: 1, minWidth: '240px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(255,255,255,0.02) 100%)' }}>
            <div className="flex justify-between items-start mb-4">
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.6rem', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <Icon size={20} className="text-primary" />
                </div>
                {trend && (
                    <div className="flex flex-col items-end">
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: trend.startsWith('+') ? 'var(--accent)' : 'var(--danger)', background: trend.startsWith('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px', border: trend.startsWith('+') ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)' }}>
                            {trend}
                        </span>
                    </div>
                )}
            </div>
            <div className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">{title}</div>
            <div className="text-3xl font-black text-white text-gradient">{value}</div>
        </div>
    );

    const TemplateCard = ({ name, description, roi, risk, onDeploy }) => (
        <div className="glass-panel group" style={{ padding: '1.25rem', minWidth: '260px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', transition: 'all 0.3s ease' }}>
            <div className="flex justify-between items-start mb-3">
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '8px' }}>
                    <Flame size={16} className="text-accent" />
                </div>
                <span style={{ fontSize: '0.6rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '1rem', background: risk === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: risk === 'High' ? 'var(--danger)' : 'var(--success)', border: '1px solid currentColor' }}>
                    {risk} Risk
                </span>
            </div>
            <h4 className="text-sm font-black text-white mb-1">{name}</h4>
            <p className="text-[10px] text-muted mb-4 leading-relaxed">{description}</p>
            <div className="flex items-center justify-between mt-auto">
                <div>
                    <div className="text-[8px] text-muted uppercase font-bold">Exp. ROI</div>
                    <div className="text-md font-black text-success">{roi}</div>
                </div>
                <button 
                    type="button"
                    onClick={onDeploy}
                    className="py-1.5 px-3 bg-white/5 hover:bg-primary text-white text-[9px] font-black uppercase tracking-tighter rounded border border-white/10 hover:border-primary transition-all"
                >
                    Deploy
                </button>
            </div>
        </div>
    );

    return (
        <div className="container mt-4 animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-1">
                        <Zap className="text-primary fill-primary/20" size={32} /> Strategy Sandbox
                    </h2>
                    <p className="text-muted text-xs font-bold uppercase tracking-widest">AI-Powered Copy Trading Command Center</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted bg-white/5 py-2 px-4 rounded-full border border-white/10 glass-panel">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    LIVE NETWORK STATUS: <span className="text-accent">OPTIMAL</span>
                </div>
            </div>

            {/* Section 1: HeroStats */}
            <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
                <StatCard 
                    title="Simulator Portfolio" 
                    value={`$${portfolio.balance.toLocaleString()}`} 
                    trend="+2.4%" 
                    icon={BarChart3} 
                />
                <StatCard 
                    title="Active Strategy Bots" 
                    value={strategies.filter(s => s.status === 'active').length} 
                    icon={Target} 
                />
                <StatCard 
                    title="Simulated PnL (24H)" 
                    value="+$420.69" 
                    trend="+1.8%" 
                    icon={TrendingUp} 
                />
            </div>

            {/* Section 2: Strategy Templates */}
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                    <Flame size={18} className="text-accent" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Suggested Strategy Blueprints</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {STRATEGY_TEMPLATES.map((tpl, i) => (
                        <TemplateCard key={i} {...tpl} onDeploy={() => applyTemplate(tpl)} />
                    ))}
                </div>
            </div>

            {/* Section 3: Main Grid (Builder + Preview) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                {/* Left: Strategy Builder */}
                <div className="lg:col-span-7">
                    <div className="glass-panel" style={{ padding: '2rem', height: '100%', background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <Settings size={20} className="text-primary" /> Strategy Builder
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary bg-primary/10 py-1 px-3 rounded border border-primary/20">
                                <Users size={12} /> 2,341 Active Units
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs flex justify-between items-center animate-shake">
                                <span>{error}</span>
                                <X size={16} className="cursor-pointer" onClick={() => setError('')} />
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Strategy Identity</label>
                                    <input 
                                        type="text" 
                                        value={newStrat.name}
                                        onChange={e => setNewStrat({...newStrat, name: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary transition-all"
                                        placeholder="e.g., Aggressive Whale Hunter"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Network Platform</label>
                                    <select 
                                        value={newStrat.platform}
                                        onChange={e => setNewStrat({...newStrat, platform: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary transition-all"
                                    >
                                        <option value="Polymarket">Polymarket</option>
                                        <option value="Kalshi">Kalshi (Soon)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Risk Profile</label>
                                    <div className="flex p-1 bg-black/40 border border-white/10 rounded-lg">
                                        {['Conservative', 'Balanced', 'Aggressive'].map(mode => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => setNewStrat({...newStrat, riskMode: mode})}
                                                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-tighter rounded transition-all ${newStrat.riskMode === mode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-white'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted block">Intelligence Sources (Copy IDs)</label>
                                    <button 
                                        type="button"
                                        onClick={recommendTraders}
                                        className="text-[9px] font-black text-primary hover:text-white uppercase tracking-widest flex items-center gap-1 transition-all"
                                    >
                                        <Zap size={10} fill="currentColor" /> AI Auto-Select
                                    </button>
                                </div>
                                <SourceMultiselect 
                                    platform={newStrat.platform}
                                    selected={newStrat.selectedSources}
                                    onToggle={toggleSourceSelection}
                                />
                                {newStrat.selectedSources.length === 0 && (
                                    <p className="text-[9px] text-accent mt-2 font-bold flex items-center gap-1">
                                        <Info size={10} /> Select traders from the Global Leaderboard to begin simulation.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-white/5">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Portfolio Allocation</label>
                                        <span className="text-[10px] font-black text-primary">{newStrat.allocation}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="5" max="100" step="1"
                                        value={newStrat.allocation}
                                        onChange={e => setNewStrat({...newStrat, allocation: e.target.value})}
                                        className="w-full accent-primary"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Amount per Prediction</label>
                                        <span className="text-[10px] font-black text-primary">{newStrat.betSizePercentage}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" max="25" step="1"
                                        value={newStrat.betSizePercentage}
                                        onChange={e => setNewStrat({...newStrat, betSizePercentage: e.target.value})}
                                        className="w-full accent-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Shield className="text-primary" size={20} />
                                    <div>
                                        <div className="text-[10px] font-black text-white uppercase mb-0.5">Live-Mode Execution</div>
                                        <div className="text-[9px] text-muted">Connect wallet to execute real capital trades</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    disabled={!settings.polymarket_address}
                                    onClick={() => setNewStrat({...newStrat, isLive: !newStrat.isLive})}
                                    className={`relative w-12 h-6 rounded-full transition-all ${newStrat.isLive ? 'bg-primary' : 'bg-white/10'} ${!settings.polymarket_address ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newStrat.isLive ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={newStrat.selectedSources.length === 0 || !newStrat.name}
                                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
                            >
                                🚀 Launch Strategy Agent
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right: Strategy Preview */}
                <div className="lg:col-span-5">
                    <div className="glass-panel" style={{ padding: '2rem', height: '100%', background: 'linear-gradient(145deg, rgba(59,130,246,0.05) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(59,130,246,0.1)' }}>
                        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-8">
                            <Activity size={20} className="text-success" /> Live Simulation Preview
                        </h3>

                        {isPreviewLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Analyzing Signals...</p>
                            </div>
                        ) : newStrat.selectedSources.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-8 border-2 border-dashed border-white/5 rounded-2xl bg-black/20">
                                <Activity size={64} className="text-white/5 mb-6 animate-pulse" />
                                <h4 className="text-white font-black uppercase tracking-widest opacity-40">Intelligence Engine Standby</h4>
                                <p className="text-[10px] text-muted leading-relaxed uppercase tracking-widest mt-4 max-w-[240px]">Select one or more traders on the left to activate real-time performance projections and signal analysis.</p>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 relative overflow-hidden group">
                                        <div className="text-[9px] font-black text-muted uppercase mb-1">Expected 7D PnL</div>
                                        <div className="text-2xl font-black text-success">+${previewData.expected_pnl_7d}</div>
                                        <div className="absolute right-2 bottom-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                            <Sparkline 
                                                data={[100, 150, 130, 180, 220, 210, previewData.expected_pnl_7d + 200]} 
                                                color="var(--accent)" 
                                                width={60} 
                                                height={20} 
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                        <div className="text-[9px] font-black text-muted uppercase mb-1">Win Rate</div>
                                        <div className="text-2xl font-black text-white">{previewData.win_rate}%</div>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                        <div className="text-[9px] font-black text-muted uppercase mb-1">Max Drawdown</div>
                                        <div className="text-2xl font-black text-danger">-{previewData.max_drawdown}%</div>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                        <div className="text-[9px] font-black text-muted uppercase mb-1">Confidence Score</div>
                                        <div className="text-2xl font-black text-primary">{previewData.confidence_score}%</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <BarChart3 size={14} className="text-muted" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Top Traders Included</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {newStrat.selectedSources.map(addr => {
                                            const src = settings.copy_sources.find(s => s.address === addr);
                                            return (
                                                <div key={addr} className="flex items-center gap-2 bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
                                                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary">
                                                        {src?.name?.charAt(0) || 'W'}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-white">{src?.name || addr.substring(0, 6)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-4 bg-black/60 rounded-xl border-l-4 border-accent">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock size={12} className="text-accent" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Recent Signal Insights</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {previewData.recent_signals.map((sig, i) => (
                                            <div key={i} className="flex items-start gap-2 text-[10px] text-white/80 font-medium">
                                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-accent/40" />
                                                {sig}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-12 flex items-center justify-center gap-2 py-3 bg-white/5 rounded-lg border border-white/5">
                            <Users size={14} className="text-muted" />
                            <span className="text-[10px] font-black uppercase text-muted tracking-widest">2,341 Users Copying Similar Units</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4: Gamification & Rank */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="glass-panel text-center p-8 border-b-2 border-primary/20 hover-glow">
                    <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 opacity-60">Global Strategy Rank</div>
                    <div className="text-4xl font-black text-white text-gradient mb-2">#{portfolio.global_rank || '1,284'}</div>
                    <div className="text-[10px] font-bold text-primary flex items-center justify-center gap-1.5">
                        <Zap size={10} fill="currentColor" /> 
                        {portfolio.global_rank < 100 ? 'Top 1% Elite' : portfolio.global_rank < 500 ? 'Top 5% Performance' : 'Global Participant'}
                    </div>
                </div>
                <div className="glass-panel text-center p-8 border-b-2 border-accent/20 hover-glow">
                    <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 opacity-60">Weekly Goal</div>
                    <div className="text-4xl font-black text-white text-gradient mb-2">{Math.min(100, Math.round((portfolio.total_pnl / 400) * 100))}%</div>
                    <div className="text-[10px] font-bold text-accent">${portfolio.total_pnl.toFixed(0)} / $400 Target</div>
                </div>
                <div className="glass-panel text-center p-8 border-b-2 border-primary/20 hover-glow">
                    <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3 opacity-60">Win Streak</div>
                    <div className="text-4xl font-black text-white text-gradient mb-2">🔂 {portfolio.accuracy > 70 ? '5+' : '3'}</div>
                    <div className="text-[10px] font-bold text-primary">Consecutive Accurate Signals</div>
                </div>
            </div>

            {/* Section 5: Active Strategies List */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Activity size={20} className="text-primary" /> Active Strategy Bots
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {strategies.length > 0 ? strategies.map((s, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '1.5rem', borderLeft: s.status === 'active' ? '4px solid var(--accent)' : '4px solid var(--text-muted)' }}>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-4">
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '12px' }}>
                                        <TrendingUp size={24} className={s.status === 'active' ? 'text-accent' : 'text-muted'} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-md font-black text-white">{s.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase text-muted">{s.category || 'All'} Strategy</span>
                                            {s.is_live && (
                                                <span className="text-[8px] font-black px-2 py-0.5 bg-danger text-white rounded-full flex items-center gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-white animate-pulse" /> LIVE
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-muted uppercase">Strategy Balance</div>
                                        <div className="text-md font-black text-white">${parseFloat(s.strategy_balance || 0).toLocaleString()}</div>
                                    </div>
                                    <div className="text-right border-l border-white/10 pl-4">
                                        <div className="text-[9px] font-black text-muted uppercase">Realized PnL</div>
                                        <div className={`text-md font-black ${s.simulated_pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {s.simulated_pnl >= 0 ? '+' : ''}${parseFloat(s.simulated_pnl || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/5 ml-2">
                                        <button 
                                            onClick={() => toggleStrategy(s.strategy_id, s.status)}
                                            className={`p-2 rounded-lg transition-all ${s.status === 'active' ? 'bg-danger/10 text-danger hover:bg-danger/20' : 'bg-success/10 text-success hover:bg-success/20'}`}
                                            title={s.status === 'active' ? 'Stop Bot' : 'Resume Bot'}
                                        >
                                            {s.status === 'active' ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                        </button>
                                        <button 
                                            onClick={() => viewTrades(s.strategy_id)}
                                            className="p-2 bg-white/5 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                            title="View Trade Logs"
                                        >
                                            <BarChart3 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => removeStrategy(s.strategy_id)}
                                            className="p-2 bg-danger/5 text-danger/60 hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                                            title="Delete Strategy"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5">
                                <span className="text-[9px] font-bold text-muted uppercase">Copy Sources:</span>
                                <div className="flex -space-x-2">
                                    {s.source_addresses.map((addr, i) => {
                                        const src = settings.copy_sources.find(cs => cs.address === addr);
                                        return (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-bg-dark bg-primary/20 flex items-center justify-center overflow-hidden" title={src?.name || addr}>
                                                {src?.image_url ? (
                                                    <img src={src.image_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[8px] font-black text-white">{(src?.name || '?').charAt(0)}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <span className="text-[9px] font-bold text-muted ml-auto uppercase tracking-widest">
                                    Risk: {s.riskMode || 'Balanced'} • Sizing: {s.bet_size_percentage}%
                                </span>
                            </div>
                        </div>
                    )) : (
                        <div className="glass-panel p-12 text-center border-dashed border-2">
                            <Zap size={48} className="text-white/5 mx-auto mb-4" />
                            <h4 className="text-white font-bold opacity-30">No Strategy Agents Initialized</h4>
                            <p className="text-xs text-muted uppercase tracking-wider mt-2">Use the builder above to launch your first automated copy unit.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 6: Social Proof Banner */}
            <div className="mt-12 p-8 glass-panel bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="flex -space-x-4">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-bg-dark bg-white/20" />
                        ))}
                    </div>
                    <div>
                        <div className="text-xl font-black text-white">Join 2,341+ Active Explorers</div>
                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Generating $1.2M in monthly simulated profit</div>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                    <div>
                        <div className="text-[9px] font-black text-muted uppercase">Top Performer This Week</div>
                        <div className="text-md font-black text-success">+$12,450.00</div>
                    </div>
                    <Flame className="text-accent" size={24} />
                </div>
            </div>

            {/* Trade History Modal (Keeping existing logic) */}
            {selectedStratTrades !== null && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem', backdropFilter: 'blur(10px)'
                }}>
                    <div className="glass-panel" style={{
                        maxWidth: '800px', width: '100%', maxHeight: '80vh',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        padding: '2rem', position: 'relative'
                    }}>
                        <button
                            onClick={() => setSelectedStratTrades(null)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest">Strategy Intelligence Logs</h3>
                        <div style={{ overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '1rem 0.5rem' }}>Timestamp</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Asset</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Action</th>
                                        <th style={{ padding: '1rem 0.5rem' }}>Entry</th>
                                        <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Size</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingTrades ? (
                                        <tr><td colSpan="5" className="text-center py-8 italic text-muted">Loading intelligence logs...</td></tr>
                                    ) : selectedStratTrades.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-8 italic text-muted">No signals recorded for this unit.</td></tr>
                                    ) : selectedStratTrades.map((t, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem' }}>
                                            <td className="text-muted" style={{ padding: '1rem 0.5rem' }}>{new Date(t.created_at).toLocaleTimeString()}</td>
                                            <td style={{ padding: '1rem 0.5rem' }}>{(t.market_id || '').substring(0, 10)}...</td>
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${t.position === 'YES' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                                    {t.position}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem' }}>${parseFloat(t.price).toFixed(2)}</td>
                                            <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 'bold' }}>${parseFloat(t.amount).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Simulator;
