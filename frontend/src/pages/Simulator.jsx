import React, { useState, useEffect, useContext, useRef } from 'react';
import { Play, Square, Settings, Activity, ChevronDown, Check, X, TrendingUp, TrendingDown, Users, Target, Zap, Shield, Flame, Info, BarChart3, Clock, Rocket, Globe } from 'lucide-react';
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
    const [wizardStep, setWizardStep] = useState(1);
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

    // Phase 4: Debounced Preview Logic
    useEffect(() => {
        if (newStrat.selectedSources.length === 0) return;

        setIsPreviewLoading(true);
        const timer = setTimeout(() => {
            // Simulated Intelligence Logic (Will be replaced by real API call)
            const baseRoi = newStrat.riskMode === 'Aggressive' ? 22.4 : newStrat.riskMode === 'Conservative' ? 8.2 : 14.5;
            
            setPreviewData({
                expected_pnl_7d: Math.round(baseRoi * (newStrat.allocation / 100) * 10),
                win_rate: 68 + Math.floor(Math.random() * 12),
                max_drawdown: Math.round(5 + Math.random() * 8),
                confidence_score: 75 + Math.floor(Math.random() * 15),
                recent_signals: [
                    "🐳 Whale identified: 0x42... entering 'Yes' on ETH ETF Approval",
                    "🎯 Sniper 0x1A... just took a size position on 'US Election Results'",
                    "⚡ Momentum shift detected in 'Fed Rate Decision' market"
                ]
            });
            setIsPreviewLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [newStrat]);

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

    const [deployedSuccess, setDeployedSuccess] = useState(false);

    const handleDeploy = async (e) => {
        if (e) e.preventDefault();
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

        const payload = {
            name: newStrat.name,
            platform: newStrat.platform,
            allocation_percentage: allocation,
            bet_size_percentage: parseFloat(newStrat.betSizePercentage) || 5.0,
            source_addresses: newStrat.selectedSources,
            category: newStrat.category || 'All',
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
                setDeployedSuccess(true);
                setTimeout(() => setDeployedSuccess(false), 5000);
                setWizardStep(1);
                setNewStrat({ name: '', platform: 'Polymarket', allocation: 10, betSizePercentage: 5, selectedSources: [], category: 'All', isLive: false, riskMode: 'Balanced' });
                refreshPortfolio();
                document.getElementById('strategy-templates')?.scrollIntoView({ behavior: 'smooth' });
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

    const StatCard = ({ title, value, trend, icon: Icon, highlight }) => (
        <div className={`glass-panel hover-glow flex flex-col justify-between ${highlight ? 'iridescent-border glow-pulse' : ''}`} style={{ padding: '1rem', height: '120px', background: highlight ? 'rgba(59, 130, 246, 0.05)' : 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)' }}>
            <div className="flex justify-between items-start">
                <div style={{ background: highlight ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)', padding: '0.5rem', borderRadius: '8px', border: highlight ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Icon size={18} className={highlight ? 'text-white' : 'text-primary'} />
                </div>
                {trend && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${trend.startsWith('+') ? 'text-accent bg-accent/10' : 'text-danger bg-danger/10'}`}>
                        {trend.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {trend}
                    </span>
                )}
            </div>
            <div>
                <div className="text-muted text-[10px] font-bold uppercase tracking-widest mb-1 opacity-50">{title}</div>
                <div className={`text-2xl font-semibold tracking-tight ${highlight ? 'text-white' : 'text-white/90'}`}>{value}</div>
            </div>
        </div>
    );

    const TemplateCard = ({ name, description, roi, risk, badge, onDeploy }) => (
        <div className="glass-panel group flex flex-col hover-expand-lg iridescent-border" style={{ padding: '1.25rem', minWidth: '280px', height: '180px', background: 'rgba(10, 13, 20, 0.8)' }}>
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-bold text-white tracking-tight">{name}</h4>
                {badge && (
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${badge.includes('Trending') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-[11px] text-muted mb-4 leading-relaxed opacity-70 line-clamp-2">{description}</p>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <div>
                    <div className="text-[9px] text-muted uppercase font-bold tracking-tighter">Exp. Returns</div>
                    <div className="text-md font-bold text-profit">{roi}</div>
                </div>
                <button 
                    type="button"
                    onClick={onDeploy}
                    className="py-2 px-4 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                >
                    Deploy
                </button>
            </div>
        </div>
    );

    return (
        <div className="container mt-4 animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Phase 7: Deployment Success Notification */}
            {deployedSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[3000] animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="glass-panel iridescent-border py-4 px-8 flex items-center gap-4 bg-success/10 backdrop-blur-2xl border-success/30 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success glow-pulse">
                            <Check size={20} strokeWidth={3} />
                        </div>
                        <div>
                            <div className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-0.5">Strategy Deployed</div>
                            <div className="text-[9px] font-bold text-success uppercase tracking-widest opacity-80">Intelligence Engine Initialized Successfully</div>
                        </div>
                    </div>
                </div>
            )}
            {/* Header (Phase 9 Cleaner) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-white/5">
                <div>
                    <h2 className="text-2xl font-semibold text-white flex items-center gap-2.5 mb-1.5">
                        <Zap className="text-primary" size={24} /> Strategy Sandbox
                    </h2>
                    <p className="text-muted text-[10px] font-medium uppercase tracking-[0.15em] opacity-60">Professional Simulation & Automated Copying</p>
                </div>
                <div className="flex items-center gap-2.5 text-[9px] font-bold tracking-widest text-muted bg-white/[0.03] py-2 px-5 rounded-full border border-white/10 glass-panel">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                    NETWORK: <span className="text-accent">OPTIMAL</span>
                </div>
            </div>

            {/* Section 1: Hero Command Center (Phase 1) */}
            <div className="grid grid-cols-4 gap-4 mb-12">
                <StatCard 
                    title="Total Portfolio" 
                    value={`$${portfolio.balance.toLocaleString()}`} 
                    highlight={true}
                    icon={BarChart3} 
                />
                <StatCard 
                    title="Profit / Loss (24H)" 
                    value="+$420.69" 
                    trend="+1.8%" 
                    icon={TrendingUp} 
                />
                <StatCard 
                    title="Active Units" 
                    value={strategies.filter(s => s.status === 'active').length} 
                    icon={Activity} 
                />
                <StatCard 
                    title="AI Confidence" 
                    value="72%" 
                    trend="+5.2%"
                    icon={Zap} 
                />
            </div>

            <div className="flex gap-4 mb-12">
                <button 
                    onClick={() => {
                        const target = document.getElementById('strategy-builder');
                        target?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                    <Rocket size={20} /> 🚀 Deploy First Strategy
                </button>
                <button 
                    onClick={() => {
                        const target = document.getElementById('strategy-templates');
                        target?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold border border-white/10 transition-all hover:scale-[1.02]"
                >
                    Explore Templates
                </button>
            </div>

            {/* Section 2: Strategy Templates V2 (Phase 2) */}
            <div id="strategy-templates" className="mb-14">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <Flame size={20} className="text-orange-500" />
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Irresistible Blueprints</h3>
                    </div>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
                    {STRATEGY_TEMPLATES.map((tpl, i) => (
                        <div key={i} className="snap-start">
                            <TemplateCard 
                                {...tpl} 
                                badge={i === 0 ? '🔥 Trending' : i === 1 ? '🎯 Safe' : '⚡ Aggressive'}
                                onDeploy={() => {
                                    applyTemplate(tpl);
                                    const preview = document.getElementById('live-preview');
                                    preview?.scrollIntoView({ behavior: 'smooth' });
                                }} 
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 3: Main Grid (Wizard + Preview) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                {/* Left: Strategy Wizard (Phase 3) */}
                <div className="lg:col-span-7">
                    <div className="glass-panel" style={{ padding: '2.5rem', height: '100%', background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}>
                        <div id="strategy-builder" className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <Settings size={20} className="text-primary" /> Strategy Wizard
                                </h3>
                                <div className="text-[10px] text-muted uppercase font-bold tracking-widest mt-1">Step {wizardStep} of 4</div>
                            </div>
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4].map(step => (
                                    <div key={step} className={`w-8 h-1 rounded-full transition-all ${wizardStep >= step ? 'bg-primary' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs flex justify-between items-center animate-shake">
                                <span>{error}</span>
                                <X size={16} className="cursor-pointer" onClick={() => setError('')} />
                            </div>
                        )}

                        <div className="space-y-8 min-h-[420px]">
                            {wizardStep === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3 block">1. Strategy Identity</label>
                                        <input 
                                            type="text" 
                                            value={newStrat.name}
                                            onChange={e => setNewStrat({...newStrat, name: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                                            placeholder="e.g., Aggressive Whale Hunter"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3 block">Network Platform</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['Polymarket', 'Kalshi'].map(p => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setNewStrat({...newStrat, platform: p})}
                                                    className={`py-3 px-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${newStrat.platform === p ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-white/5 text-muted'}`}
                                                >
                                                    {p} {p === 'Kalshi' && '(Soon)'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {wizardStep === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3 block">2. Risk Profile</label>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { name: 'Conservative', desc: 'Focus on high-probability stable yields', icon: Shield },
                                            { name: 'Balanced', desc: 'Default mix of safety and performance', icon: Activity },
                                            { name: 'Aggressive', desc: 'Maximized exposure for high-growth targets', icon: Flame }
                                        ].map(r => (
                                            <button
                                                key={r.name}
                                                type="button"
                                                onClick={() => setNewStrat({...newStrat, riskMode: r.name})}
                                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${newStrat.riskMode === r.name ? 'border-primary bg-primary/10' : 'border-white/5 bg-white/5'}`}
                                            >
                                                <div className={`p-2 rounded-lg ${newStrat.riskMode === r.name ? 'bg-primary text-white' : 'bg-white/5 text-muted'}`}>
                                                    <r.icon size={18} />
                                                </div>
                                                <div>
                                                    <div className={`text-[10px] font-bold uppercase tracking-widest ${newStrat.riskMode === r.name ? 'text-white' : 'text-muted'}`}>{r.name}</div>
                                                    <div className="text-[9px] text-muted opacity-60 mt-0.5">{r.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {wizardStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted block">3. Intelligence Sources (Traders)</label>
                                        <button 
                                            type="button"
                                            onClick={recommendTraders}
                                            className="text-[9px] font-black text-primary hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-all bg-primary/10 px-3 py-1 rounded-full border border-primary/20"
                                        >
                                            <Zap size={10} fill="currentColor" /> AI Auto-Select
                                        </button>
                                    </div>
                                    <SourceMultiselect 
                                        platform={newStrat.platform}
                                        selected={newStrat.selectedSources}
                                        onToggle={toggleSourceSelection}
                                    />
                                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Settings size={12} className="text-primary" />
                                            <div className="text-[10px] font-bold text-white uppercase tracking-widest">Trader Selection Engine</div>
                                        </div>
                                        <p className="text-[9px] text-muted leading-relaxed">Search, filter by ROI, and sort by WhaleScore in the leaderboard to refine your strategy inputs.</p>
                                    </div>
                                </div>
                            )}

                            {wizardStep === 4 && (
                                <div className="space-y-8 animate-fade-in">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1 block">4. Final Calibration</label>
                                    
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Portfolio Allocation</label>
                                                <span className="text-sm font-black text-primary">{newStrat.allocation}%</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="5" max="100" step="1"
                                                value={newStrat.allocation}
                                                onChange={e => setNewStrat({...newStrat, allocation: e.target.value})}
                                                className="w-full accent-primary h-1 bg-white/10 rounded-full appearance-none hover:bg-white/20 transition-all"
                                            />
                                        </div>

                                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Amount per Signal</label>
                                                <span className="text-sm font-black text-primary">{newStrat.betSizePercentage}%</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="1" max="25" step="1"
                                                value={newStrat.betSizePercentage}
                                                onChange={e => setNewStrat({...newStrat, betSizePercentage: e.target.value})}
                                                className="w-full accent-primary h-1 bg-white/10 rounded-full appearance-none hover:bg-white/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <Shield className="text-primary" size={20} />
                                            <div>
                                                <div className="text-[10px] font-bold text-white uppercase mb-0.5">Live Execution</div>
                                                <div className="text-[9px] text-muted uppercase tracking-tighter">Requires connected wallet</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={!settings.polymarket_address}
                                            onClick={() => setNewStrat({...newStrat, isLive: !newStrat.isLive})}
                                            className={`relative w-12 h-6 rounded-full transition-all ${newStrat.isLive ? 'bg-primary' : 'bg-white/10'} ${!settings.polymarket_address ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-lg ${newStrat.isLive ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 mt-10">
                            {wizardStep > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setWizardStep(prev => prev - 1)}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-2xl border border-white/10 transition-all"
                                >
                                    Back
                                </button>
                            )}
                            {wizardStep < 4 ? (
                                <button
                                    type="button"
                                    onClick={() => setWizardStep(prev => prev + 1)}
                                    className="flex-[2] py-4 bg-primary hover:bg-primary-hover text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all transform hover:scale-[1.02]"
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleDeploy()}
                                    disabled={newStrat.selectedSources.length === 0 || !newStrat.name}
                                    className="flex-[2] py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl shadow-2xl shadow-primary/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 group overflow-hidden relative"
                                >
                                    <div className="relative z-10 flex flex-col items-center">
                                        <span className="text-[12px] font-black uppercase tracking-[0.2em]">🚀 Launch Strategy Bot</span>
                                        <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Runs instantly • No risk</span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Strategy Preview (Phase 4 Live) */}
                <div id="live-preview" className="lg:col-span-5">
                    <div className="glass-panel iridescent-border" style={{ padding: '2.5rem', height: '100%', background: 'rgba(10, 13, 20, 0.9)' }}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <Activity size={20} className="text-success glow-pulse" /> Live Preview
                            </h3>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 rounded-full border border-success/20">
                                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                                <span className="text-[9px] font-bold text-success uppercase tracking-widest">Real-time</span>
                            </div>
                        </div>

                        {isPreviewLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-6">
                                <Activity size={48} className="text-primary/20 animate-pulse" />
                                <div className="flex flex-col items-center gap-1">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Synthesizing Signals</p>
                                    <p className="text-[9px] text-muted uppercase font-bold tracking-widest opacity-40">Intelligence Engine Active</p>
                                </div>
                            </div>
                        ) : newStrat.selectedSources.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[440px] text-center px-10 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                                <div className="p-6 bg-white/5 rounded-full mb-8">
                                    <Rocket size={48} className="text-white/10" />
                                </div>
                                <h4 className="text-white font-black uppercase tracking-widest opacity-60 mb-3">Intelligence Engine Standby</h4>
                                <p className="text-[10px] text-muted leading-relaxed uppercase tracking-[0.1em] max-w-[280px]">Select traders or use a template to activate real-time performance projections.</p>
                            </div>
                        ) : (
                            <div className="space-y-10 animate-fade-in">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5 relative group overflow-hidden">
                                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 opacity-60">Expected 7D PnL</div>
                                        <div className="text-3xl font-black text-profit tracking-tighter">+${previewData.expected_pnl_7d}</div>
                                        <div className="mt-4">
                                            <Sparkline 
                                                data={[100, 150, 130, 180, 220, 210, previewData.expected_pnl_7d + 200]} 
                                                color="var(--neon-green)" 
                                                width={120} 
                                                height={30} 
                                            />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 opacity-60">Success Rate</div>
                                        <div className="text-3xl font-black text-white tracking-tighter">{previewData.win_rate}%</div>
                                        <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${previewData.win_rate}%` }} />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 opacity-60">Max Drawdown</div>
                                        <div className="text-3xl font-black text-loss tracking-tighter">-{previewData.max_drawdown}%</div>
                                    </div>
                                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 opacity-60">Confidence</div>
                                        <div className="text-3xl font-black text-primary tracking-tighter">{previewData.confidence_score}%</div>
                                    </div>
                                </div>

                                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Users size={16} className="text-primary" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Active Signal Source</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {newStrat.selectedSources.map(addr => {
                                            const src = settings.copy_sources.find(s => s.address === addr);
                                            return (
                                                <div key={addr} className="flex items-center gap-2.5 bg-black/40 py-2 px-4 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-crosshair">
                                                    <div className="w-5 h-5 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                                                        {src?.name?.charAt(0) || 'W'}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-white/90">{src?.name || addr.substring(0, 6)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden">
                                    <div className="flex items-center gap-2.5 mb-4 relative z-10">
                                        <Zap size={14} className="text-primary" fill="currentColor" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Live Signal Insights</h4>
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        {previewData.recent_signals.length > 0 ? previewData.recent_signals.map((sig, i) => (
                                            <div key={i} className="flex items-start gap-3 text-[11px] text-white/90 font-medium leading-relaxed italic animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                                {sig}
                                            </div>
                                        )) : (
                                            <p className="text-[10px] text-muted uppercase font-bold tracking-widest animate-pulse">Scanning social signals...</p>
                                        )}
                                    </div>
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Activity size={120} className="text-primary" />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-14 p-4 bg-white/[0.03] rounded-xl border border-white/5 flex items-center justify-center gap-3">
                            <Check size={14} className="text-success" />
                            <span className="text-[9px] font-bold uppercase text-muted tracking-[0.2em]">Institutional Grade Simulation</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4: Performance Console (Phase 5 Refined) */}
            <div className="glass-panel iridescent-border mb-12" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="p-8 text-center hover:bg-white/[0.02] transition-all group">
                        <div className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-4 opacity-60 group-hover:opacity-100 transition-opacity">Global Strategy Rank</div>
                        <div className="text-4xl font-black text-white tracking-tighter mb-3 scale-100 group-hover:scale-105 transition-transform">#{portfolio.global_rank || '1,284'}</div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                            <Zap size={10} className="text-primary" fill="currentColor" />
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                                {portfolio.global_rank < 100 ? 'Top 1% Elite' : portfolio.global_rank < 500 ? 'Top 5% Performance' : 'Global Participant'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="p-8 text-center hover:bg-white/[0.02] transition-all group border-white/10">
                        <div className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-4 opacity-60 group-hover:opacity-100 transition-opacity">Weekly Goal Progress</div>
                        <div className="text-4xl font-black text-white tracking-tighter mb-4">
                            {Math.min(100, Math.round((portfolio.total_pnl / 400) * 100))}%
                        </div>
                        <div className="w-48 h-1.5 bg-white/5 rounded-full mx-auto overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-accent shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-1000" 
                                style={{ width: `${Math.min(100, Math.round((portfolio.total_pnl / 400) * 100))}%` }} 
                            />
                        </div>
                        <div className="text-[9px] font-bold text-accent uppercase tracking-widest mt-3 opacity-80">
                            ${portfolio.total_pnl.toFixed(0)} / $400 Target
                        </div>
                    </div>
                    
                    <div className="p-8 text-center hover:bg-white/[0.02] transition-all group">
                        <div className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-4 opacity-60 group-hover:opacity-100 transition-opacity">Active Win Streak</div>
                        <div className="text-4xl font-black text-profit tracking-tighter mb-3">
                             {portfolio.accuracy > 70 ? '5+' : '3'} <span className="text-sm font-bold text-muted/60">Wins</span>
                        </div>
                        <div className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-2 opacity-80">
                            <TrendingUp size={10} /> Consecutive Accuracy Bonus
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 5: Active Strategies List (Phase 9 Cleaner) */}
            <div className="mb-14">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2.5">
                        <Activity size={18} className="text-white/40" />
                        <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-[0.2em]">Running Strategy Units</h3>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                        <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-success uppercase tracking-widest">{strategies.filter(s => s.status === 'active').length} Active</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                    {strategies.length > 0 ? strategies.map((s, idx) => (
                        <div key={idx} className="glass-panel group hover:border-primary/30 transition-all duration-500 overflow-hidden" style={{ padding: '0' }}>
                            <div className="flex flex-col md:flex-row md:items-center">
                                {/* Left Side: Status & Info */}
                                <div className="flex-1 p-6 flex items-center gap-5 border-b md:border-b-0 md:border-r border-white/5">
                                    <div className={`p-3.5 rounded-2xl ${s.status === 'active' ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-white/5 text-muted'} transition-all group-hover:scale-110`}>
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-1.5">
                                            <h4 className="text-sm font-black text-white tracking-wide">{s.name}</h4>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest border ${s.status === 'active' ? 'bg-success/10 text-success border-success/20' : 'bg-white/5 text-muted border-white/10'}`}>
                                                {s.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-[10px] text-muted font-bold uppercase tracking-widest">
                                                <Target size={12} className="opacity-40" /> {s.platform}
                                            </div>
                                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                                            <div className="text-[10px] text-muted font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Settings size={12} className="opacity-40" /> {s.riskMode || 'Balanced'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Metrics */}
                                <div className="p-6 flex items-center gap-12 border-b md:border-b-0 md:border-r border-white/5">
                                    <div>
                                        <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1.5 opacity-60">Balance</div>
                                        <div className="text-lg font-black text-white tracking-tighter">${parseFloat(s.strategy_balance || 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1.5 opacity-60">Net PnL</div>
                                        <div className={`text-lg font-black tracking-tighter ${s.simulated_pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                                            {s.simulated_pnl >= 0 ? '+' : ''}${Math.abs(parseFloat(s.simulated_pnl || 0)).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="text-right border-l border-white/10 pl-4 hidden md:block">
                                        <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1.5 opacity-60">Growth</div>
                                        <div className="text-lg font-black text-white tracking-tighter">7.2%</div>
                                    </div>
                                </div>

                                {/* Right Side: Sources & Actions */}
                                <div className="p-6 flex items-center justify-between md:justify-end gap-6 bg-white/[0.01]">
                                    <div className="flex -space-x-3">
                                        {s.source_addresses.slice(0, 3).map((addr, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0d14] bg-primary/20 flex items-center justify-center hover:z-10 transition-transform hover:scale-110 cursor-help" title={addr}>
                                                <span className="text-[10px] font-black text-primary">W</span>
                                            </div>
                                        ))}
                                        {s.source_addresses.length > 3 && (
                                            <div className="w-8 h-8 rounded-full border-2 border-[#0a0d14] bg-white/5 flex items-center justify-center">
                                                <span className="text-[9px] font-bold text-muted">+{s.source_addresses.length - 3}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => toggleStrategy(s.strategy_id, s.status)}
                                            className={`p-3 rounded-xl transition-all shadow-lg ${s.status === 'active' ? 'bg-danger/10 text-danger hover:bg-danger/20 hover:scale-105' : 'bg-success/10 text-success hover:bg-success/20 hover:scale-105'}`}
                                        >
                                            {s.status === 'active' ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                        </button>
                                        <button 
                                            onClick={() => viewTrades(s.strategy_id)}
                                            className="p-3 bg-white/5 text-muted hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-105"
                                        >
                                            <BarChart3 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => removeStrategy(s.strategy_id)}
                                            className="p-3 bg-danger/5 text-danger/40 hover:text-danger hover:bg-danger/10 rounded-xl transition-all hover:scale-105"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/10">
                            <Rocket size={40} className="text-white/10 mb-6" />
                            <p className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">No Strategic Units Deployed</p>
                            <button 
                                onClick={() => document.getElementById('strategy-builder')?.scrollIntoView({ behavior: 'smooth' })}
                                className="mt-6 text-[10px] font-black text-primary hover:text-white uppercase tracking-widest transition-all"
                            >
                                Build Your First Strategy →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 6: Global Activity & Social Proof (Phase 6) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2.5">
                            <Globe size={18} className="text-primary" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Institutional Signal Feed</h3>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-bold text-muted uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-success rounded-full" /> 2.1k Online</span>
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-primary rounded-full" /> 42 New Signals</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { user: "Whale 0x72...", action: "deployed massive 'Aggressive' unit", time: "2m ago", roi: "+24.2%" },
                            { user: "Sniper 0x1A...", action: "just hit 5th consecutive win streak", time: "5m ago", roi: "+12.8%" },
                            { user: "Polymarket Alpha", action: "rebalanced allocation for 'Election' markets", time: "12m ago", roi: "+8.5%" }
                        ].map((act, i) => (
                            <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-all cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs group-hover:bg-primary/20 transition-all">
                                        {act.user.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-black text-white">{act.user}</span>
                                            <span className="text-[10px] text-muted font-medium">{act.time}</span>
                                        </div>
                                        <p className="text-[11px] text-muted opacity-80 italic">{act.action}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Avg ROI</div>
                                    <div className="text-sm font-black text-profit">{act.roi}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="glass-panel iridescent-border" style={{ height: '100%', padding: '2rem' }}>
                        <div className="flex items-center gap-2.5 mb-8">
                            <Zap size={18} className="text-accent" fill="currentColor" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">AI Sidekick Analysis</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-5 bg-accent/5 rounded-2xl border border-accent/20 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-3">Alpha Opportunity</div>
                                    <p className="text-[11px] text-white/90 leading-relaxed font-medium">Top 5 whales are currently shifting 40% of their volume into 'Entertainment' markets. Consider a new unit for maximum alpha.</p>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={60} className="text-accent" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-muted uppercase">Global Confidence</span>
                                    <span className="text-[10px] font-black text-white">82%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: '82%' }} />
                                </div>
                                <p className="text-[9px] text-muted uppercase font-bold tracking-tighter opacity-60">Calculated from 2.4k active signal sources</p>
                            </div>

                            <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/10 transition-all">
                                Get More Insights
                            </button>
                        </div>
                    </div>
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
