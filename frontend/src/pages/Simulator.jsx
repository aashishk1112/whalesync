import React, { useState, useEffect, useContext, useRef } from 'react';
import { Play, Square, Settings, Activity, ChevronDown, ChevronRight, Check, X, TrendingUp, TrendingDown, Users, Target, Zap, Shield, Flame, Info, BarChart3, Clock, Rocket, Globe, Award } from 'lucide-react';
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

const StrategySandbox = () => {
    const { user } = useContext(AuthContext);
    const { portfolio, settings, refreshPortfolio } = useContext(PortfolioContext);
    const [strategies, setStrategies] = useState([]);
    const [wizardStep, setWizardStep] = useState(1);
    const [archetypes, setArchetypes] = useState({});
    const [loadingArchetypes, setLoadingArchetypes] = useState(true);
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

    useEffect(() => {
        const fetchArchetypes = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/traders/archetypes`);
                const data = await res.json();
                if (data.archetypes) {
                    setArchetypes(data.archetypes);
                }
            } catch (err) {
                console.error("Error fetching archetypes:", err);
            } finally {
                setLoadingArchetypes(false);
            }
        };
        fetchArchetypes();
    }, []);

    const STRATEGY_TEMPLATES = [
        {
            name: "Copy Top Whales",
            description: `Automatically tracks ${archetypes.top_whale?.username || 'top whales'} (WhaleScore: ${archetypes.top_whale?.whale_score?.toFixed(1) || '92.4'}).`,
            roi: archetypes.top_whale?.roi ? `+${archetypes.top_whale.roi.toFixed(1)}%` : "+18.4%",
            risk: "Medium",
            config: { allocation: 15, betSize: 5, riskMode: 'Balanced' },
            source_address: archetypes.top_whale?.address
        },
        {
            name: "Win Rate Snipers",
            description: `Focuses on ${archetypes.safest?.username || 'low-risk snipers'} (Accuracy: ${((archetypes.safest?.win_rate || 0.75) * 100).toFixed(0)}%).`,
            roi: archetypes.safest?.roi ? `+${archetypes.safest.roi.toFixed(1)}%` : "+12.1%",
            risk: "Low",
            config: { allocation: 10, betSize: 2, riskMode: 'Conservative' },
            source_address: archetypes.safest?.address
        },
        {
            name: "Momentum Seekers",
            description: `Aggressive copying of ${archetypes.trending?.username || 'trending traders'} (+${archetypes.trending?.roi?.toFixed(1) || '28'}% spike).`,
            roi: archetypes.trending?.roi ? `+${archetypes.trending.roi.toFixed(1)}%` : "+28.7%",
            risk: "High",
            config: { allocation: 25, betSize: 10, riskMode: 'Aggressive' },
            source_address: archetypes.trending?.address
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

    const Metric = ({ label, value, subtext }) => (
        <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">{label}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">{value}</h3>
                {subtext && <span className="text-[10px] font-bold text-success capitalize">{subtext}</span>}
            </div>
        </div>
    );

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
        <div className={`glass-panel hover-glow flex flex-col justify-between ${highlight ? 'iridescent-border glow-pulse' : ''}`} style={{ padding: '1rem', height: '120px', minWidth: '0', background: highlight ? 'rgba(59, 130, 246, 0.05)' : 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)' }}>
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

    const TemplateCardV2 = ({ name, description, roi, risk, badge, onDeploy }) => (
        <div className="glass-panel group flex flex-col hover-expand-lg iridescent-border relative overflow-hidden" style={{ padding: '1.25rem', minWidth: '300px', flex: '0 0 300px', height: '220px', background: 'rgba(10, 13, 20, 0.8)' }}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                    <h4 className="text-sm font-black text-white tracking-tight leading-tight mb-1">{name}</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-muted uppercase tracking-widest flex items-center gap-1">
                            <Users size={10} /> 1.2k copying
                        </span>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <span className="text-[8px] font-black text-profit uppercase tracking-widest animate-pulse">
                            Live ROI
                        </span>
                    </div>
                </div>
                {badge && (
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${badge.includes('Trending') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                        {badge}
                    </span>
                )}
            </div>
            
            <p className="text-[10px] text-muted mb-4 leading-relaxed opacity-60 line-clamp-2 font-medium">{description}</p>
            
            <div className="mb-4 flex items-center gap-4">
                <div className="flex-1 h-10 bg-white/5 rounded-lg border border-white/5 p-2 flex items-center justify-center">
                    <Sparkline data={[10, 15, 12, 18, 25, 22, 30]} color={roi.includes('+') ? '#10b981' : '#f43f5e'} width={180} height={20} />
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <div>
                    <div className="text-[8px] text-muted uppercase font-black tracking-widest opacity-40 mb-0.5">EST. RETURNS</div>
                    <div className="text-sm font-black text-profit flex items-center gap-1">
                        {roi}
                        <span className="text-[8px] opacity-40 font-bold">APY</span>
                    </div>
                </div>
                <button 
                    type="button"
                    onClick={onDeploy}
                    className="py-2.5 px-5 bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-105 transition-all"
                >
                    Use Strategy
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 relative">
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
            {/* Header (Branded: Strategy Sandbox) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-white/5">
                <div>
                    <h2 className="text-2xl font-semibold text-white flex items-center gap-2.5 mb-1.5">
                        <Zap className="text-primary" size={24} /> Strategy Sandbox
                    </h2>
                    <p className="text-muted text-[10px] font-medium uppercase tracking-[0.15em] opacity-60">Professional Simulation & Automated Copying</p>
                </div>
                <div className="flex items-center gap-2.5 text-[9px] font-bold tracking-widest text-muted bg-white/[0.03] py-2 px-5 rounded-full border border-white/10 glass-panel-unified">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                    NETWORK: <span className="text-accent">OPTIMAL</span>
                </div>
            </div>

            {/* Section 1: Hero Command Center (Strategy Sandbox Style) */}
            <div className="mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', width: '100%' }}>
                <StatCard 
                    title="Total Portfolio" 
                    value={`$${portfolio.balance.toLocaleString()}`} 
                    highlight={true}
                    icon={BarChart3} 
                />
                <StatCard 
                    title="Profit / Loss (24H)" 
                    value={portfolio.total_pnl >= 0 ? `+$${portfolio.total_pnl.toFixed(2)}` : `-$${Math.abs(portfolio.total_pnl).toFixed(2)}`} 
                    trend={`${portfolio.accuracy}% WinRate`} 
                    icon={TrendingUp} 
                />
                <StatCard 
                    title="Active Bots" 
                    value={strategies.filter(s => s.status === 'active').length} 
                    icon={Activity} 
                />
                <StatCard 
                    title="AI Confidence" 
                    value={`${(newStrat.selectedSources.length > 0 ? (previewData.confidence_score) : 72)}%`} 
                    trend="+5.2%"
                    icon={Zap} 
                />
            </div>

            {/* FIX 1: QuickStartBar (Guided Entry Point) */}
            <div className="mb-12">
                <div className="glass-panel-unified p-4 flex items-center justify-between border-primary/20 bg-primary/[0.02]">
                    <div className="flex items-center gap-4 px-4 border-r border-white/10">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group">
                            <Rocket size={20} className="group-hover:animate-bounce" />
                        </div>
                        <div>
                            <div className="text-[11px] font-black text-white uppercase tracking-widest">Start in 10 seconds</div>
                            <div className="text-[9px] text-muted font-bold uppercase tracking-widest opacity-60">guided entry point</div>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-around px-8">
                        <button 
                            onClick={() => {
                                applyTemplate(STRATEGY_TEMPLATES[0]);
                                document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="flex items-center gap-3 py-3 px-6 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 transition-all group"
                        >
                            <span className="text-lg">🚀</span>
                            <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-blue-400 transition-colors">AI Strategy</span>
                        </button>
                        
                        <div className="w-px h-8 bg-white/5" />
                        
                        <button 
                            onClick={() => {
                                recommendTraders();
                                document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="flex items-center gap-3 py-3 px-6 rounded-xl bg-green-600/10 hover:bg-green-600/20 border border-green-600/30 transition-all group"
                        >
                            <span className="text-lg">🔥</span>
                            <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-green-400 transition-colors">Copy Whales</span>
                        </button>
                        
                        <div className="w-px h-8 bg-white/5" />
                        
                        <button 
                            onClick={() => document.getElementById('strategy-builder')?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex items-center gap-3 py-3 px-6 rounded-xl bg-gray-700/10 hover:bg-gray-700/20 border border-gray-700/30 transition-all group"
                        >
                            <span className="text-lg">⚙️</span>
                            <span className="text-[11px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-all">Manual Build</span>
                        </button>
                    </div>
                </div>
            </div>


            {/* FIX 4: Templates as Primary Driver (Repositioned ABOVE Builder) */}
            <div id="strategy-templates" className="mb-14">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Flame size={20} />
                        </div>
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90">Institutional Blueprints</h3>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">pre-configured alpha engines</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
                    {STRATEGY_TEMPLATES.map((tpl, i) => (
                        <div key={i} className="snap-start">
                            <TemplateCardV2 
                                {...tpl} 
                                badge={i === 0 ? '🔥 Trending' : i === 1 ? '🎯 Safe' : '⚡ Aggressive'}
                                onDeploy={() => {
                                    applyTemplate(tpl);
                                    setWizardStep(4); // Jump to confirmation
                                    document.getElementById('live-preview')?.scrollIntoView({ behavior: 'smooth' });
                                }} 
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 3: Main Grid (Wizard + Preview) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-stretch">
                {/* Left: Strategy Wizard (Phase 3) */}
                <div id="strategy-builder" className="lg:col-span-12 lg:mb-4">
                    <div className="glass-panel-unified p-10 relative overflow-hidden h-full">
                        {/* Step Indicator (Addictive UX) */}
                        <div className="step-indicator">
                            {[1, 2, 3, 4].map(step => (
                                <div key={step} className={`step-dot ${wizardStep >= step ? 'active' : ''}`} />
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-12 gap-10 items-stretch">
                            {/* Left: Wizard Form (FIX 3: BuilderFlow) */}
                            <div className="lg:col-span-7 pr-0 lg:pr-10 border-b lg:border-b-0 lg:border-r border-white/5 pb-10 lg:pb-0">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                            {wizardStep === 1 ? <Target size={20} /> : 
                                             wizardStep === 2 ? <Shield size={20} /> :
                                             wizardStep === 3 ? <Users size={20} /> : <Rocket size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-0.5">
                                                {wizardStep === 1 ? 'Strategic Identity' : 
                                                 wizardStep === 2 ? 'Risk Architecture' :
                                                 wizardStep === 3 ? 'Intelligence Sources' : 'Final Ignition'}
                                            </h3>
                                            <div className="text-[9px] text-muted font-bold uppercase tracking-[0.2em] opacity-40">Phase {wizardStep} of 4 • AI-Guided Build</div>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-primary/5 border border-primary/10 rounded-lg flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Auto-Optimizer Active</span>
                                    </div>
                                </div>

                                <div className="space-y-8 min-h-[440px]">
                                    {wizardStep === 1 && (
                                        <div className="space-y-8 animate-fade-in">
                                            <div className="group">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 block group-hover:text-primary transition-colors">Unit Designation</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. BTC Alpha Momentum"
                                                    value={newStrat.name}
                                                    onChange={e => setNewStrat({...newStrat, name: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-5 text-sm text-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium placeholder:text-white/10"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 block">Deployment Layer</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {['Polymarket', 'Hyperliquid'].map(p => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => setNewStrat({...newStrat, platform: p})}
                                                            className={`py-4 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all ${newStrat.platform === p ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-transparent border-white/5 text-muted hover:border-white/20'}`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 2 && (
                                        <div className="space-y-8 animate-fade-in">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 block">Risk Profile Architecture</label>
                                            <div className="grid grid-cols-1 gap-4">
                                                {[
                                                    { name: 'Conservative', desc: 'Prioritize preservation (1-2% per trade)', icon: Shield, color: 'text-success' },
                                                    { name: 'Balanced', desc: 'Optimized risk/reward (3-5% per trade)', icon: Activity, color: 'text-primary' },
                                                    { name: 'Aggressive', desc: 'Maximum alpha capture (5-10% per trade)', icon: Flame, color: 'text-accent' }
                                                ].map(r => (
                                                    <button
                                                        key={r.name}
                                                        type="button"
                                                        onClick={() => setNewStrat({...newStrat, riskMode: r.name})}
                                                        className={`flex items-center gap-5 p-6 rounded-2xl border-2 transition-all text-left group ${newStrat.riskMode === r.name ? 'border-primary bg-primary/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/5'}`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${newStrat.riskMode === r.name ? 'bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 text-muted group-hover:bg-white/10'}`}>
                                                            <r.icon size={24} />
                                                        </div>
                                                        <div>
                                                            <div className={`text-[12px] font-black uppercase tracking-[0.2em] ${newStrat.riskMode === r.name ? 'text-white' : 'text-muted'}`}>{r.name}</div>
                                                            <div className="text-[10px] text-muted opacity-60 font-bold uppercase tracking-widest mt-1">{r.desc}</div>
                                                        </div>
                                                        {newStrat.riskMode === r.name && (
                                                            <div className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                                                                <Check size={14} className="text-white" strokeWidth={4} />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 3 && (
                                        <div className="space-y-8 animate-fade-in">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="group">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted block group-hover:text-primary transition-colors">Intelligence Sources</label>
                                                    <p className="text-[9px] text-muted opacity-40 font-bold uppercase tracking-widest mt-1">SELECT WHALES TO MIRROR</p>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={recommendTraders}
                                                    className="text-[10px] font-black text-primary hover:text-white uppercase tracking-widest flex items-center gap-2 transition-all bg-primary/10 px-5 py-2.5 rounded-xl border border-primary/20 hover:bg-primary/20"
                                                >
                                                    <Zap size={14} fill="currentColor" /> AI Auto-Select
                                                </button>
                                            </div>
                                            <div className="max-h-[340px] overflow-y-auto pr-3 custom-scrollbar">
                                                <SourceMultiselect 
                                                    platform={newStrat.platform}
                                                    selected={newStrat.selectedSources}
                                                    onToggle={toggleSourceSelection}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {wizardStep === 4 && (
                                        <div className="space-y-8 animate-fade-in">
                                            <div className="text-center py-6">
                                                <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6 animate-bounce shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                                                    <Rocket size={40} />
                                                </div>
                                                <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Ignition Point</h4>
                                                <p className="text-[11px] text-muted max-w-[340px] mx-auto leading-relaxed uppercase tracking-widest opacity-60">Strategy units are synchronized. Intelligence modules are hot. Launch now to initiate real-time copy execution.</p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-5">
                                                <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/10 hover:border-primary/30 transition-all group">
                                                    <div className="flex justify-between items-center mb-5">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted group-hover:text-primary transition-colors">Allocation Calibrator</label>
                                                        <div className="px-3 py-1 bg-primary/10 rounded-lg text-primary text-[11px] font-black uppercase tracking-widest">{newStrat.allocation}%</div>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="5" max="100" step="1"
                                                        value={newStrat.allocation}
                                                        onChange={e => setNewStrat({...newStrat, allocation: e.target.value})}
                                                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                                                    />
                                                    <div className="flex justify-between mt-3 text-[8px] font-black text-muted uppercase tracking-widest opacity-40">
                                                        <span>Conservative</span>
                                                        <span>Max Capital</span>
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/10 hover:border-primary/30 transition-all group">
                                                    <div className="flex justify-between items-center mb-5">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted group-hover:text-primary transition-colors">Unit Bet Size</label>
                                                        <div className="px-3 py-1 bg-primary/10 rounded-lg text-primary text-[11px] font-black uppercase tracking-widest">{newStrat.betSizePercentage}%</div>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="1" max="25" step="1"
                                                        value={newStrat.betSizePercentage}
                                                        onChange={e => setNewStrat({...newStrat, betSizePercentage: e.target.value})}
                                                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                                                    />
                                                    <div className="flex justify-between mt-3 text-[8px] font-black text-muted uppercase tracking-widest opacity-40">
                                                        <span>Low Risk</span>
                                                        <span>High Momentum</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-5 mt-12 pt-10 border-t border-white/5">
                                    {wizardStep > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setWizardStep(prev => prev - 1)}
                                            className="px-8 py-5 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl border border-white/10 transition-all flex items-center gap-2 group"
                                        >
                                            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> BACK
                                        </button>
                                    )}
                                    {wizardStep < 4 ? (
                                        <button
                                            type="button"
                                            onClick={() => setWizardStep(prev => prev + 1)}
                                            className="flex-1 py-5 bg-primary hover:bg-primary-hover text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
                                        >
                                            Next Phase <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleDeploy()}
                                            disabled={newStrat.selectedSources.length === 0 || !newStrat.name}
                                            className="flex-1 py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl shadow-2xl shadow-primary/40 transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 group overflow-hidden relative"
                                        >
                                            <div className="relative z-10 flex flex-col items-center">
                                                <span className="text-[13px] font-black uppercase tracking-[0.3em]">🚀 Launch Strategy Bot</span>
                                                <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Runs instantly • Institutional Grade</span>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        </button>
                                    )}
                                </div>

                                {/* FIX 5: Sticky Primary CTA (Strategic Launch) */}
                                {newStrat.name && newStrat.selectedSources.length > 0 && (
                                    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[2000] animate-in slide-in-from-bottom-10 duration-700">
                                        <button 
                                            onClick={handleDeploy}
                                            className="group relative flex flex-col items-center justify-center py-6 px-16 bg-primary rounded-3xl shadow-[0_25px_60px_rgba(59,130,246,0.6)] border border-primary-hover transition-all hover:scale-105 active:scale-95 overflow-hidden"
                                        >
                                            <div className="relative z-10 text-center">
                                                <div className="flex items-center gap-3 mb-1 justify-center">
                                                    <Rocket size={18} className="text-white group-hover:animate-bounce" />
                                                    <span className="text-[14px] font-black text-white uppercase tracking-[0.4em]">Launch Strategy Bot</span>
                                                </div>
                                                <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Execute AI-Guided Returns Instantly</p>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1500ms]" />
                                            <div className="absolute -inset-1 bg-primary/20 blur-2xl group-hover:bg-primary/40 transition-all" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Right: Strategy Preview (Phase 4 Live) */}
                            <div id="live-preview" className="lg:col-span-5 flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
                                        <Activity size={20} className="text-success glow-pulse" /> Live Analysis
                                    </h3>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 rounded-full border border-success/20">
                                        <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                                        <span className="text-[9px] font-black text-success uppercase tracking-widest">Real-time</span>
                                    </div>
                                </div>

                                {isPreviewLoading ? (
                                    <div className="flex flex-col items-center justify-center flex-1 gap-6">
                                        <Activity size={48} className="text-primary/20 animate-pulse" />
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Synthesizing Signals</p>
                                            <p className="text-[9px] text-muted uppercase font-bold tracking-widest opacity-40">Intelligence Engine Active</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-fade-in flex-1">
                                        {/* Status Tag */}
                                        <div className="flex items-center gap-2 mb-2">
                                            {newStrat.selectedSources.length === 0 ? (
                                                <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">Showing Sample Performance</span>
                                            ) : (
                                                <span className="text-[8px] font-black text-success bg-success/10 px-2 py-0.5 rounded border border-success/20 uppercase tracking-widest flex items-center gap-1.5">
                                                    <div className="w-1 h-1 bg-success rounded-full animate-pulse" /> Live Analysis Mode
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <Metric 
                                                label="PnL (Projection)" 
                                                value={newStrat.selectedSources.length === 0 ? `+$${(portfolio.balance * 0.06).toLocaleString(undefined, {maximumFractionDigits: 0})}` : `+$${previewData.expected_pnl_7d.toLocaleString()}`} 
                                                subtext="7d estimate"
                                            />
                                            <Metric 
                                                label="Win Rate" 
                                                value={newStrat.selectedSources.length === 0 ? '61%' : `${previewData.win_rate}%`} 
                                                subtext="optimal"
                                            />
                                            <Metric 
                                                label="Drawdown" 
                                                value={newStrat.selectedSources.length === 0 ? '-4.2%' : `-${previewData.max_drawdown}%`} 
                                                subtext="max expected"
                                            />
                                            <Metric 
                                                label="AI Confidence" 
                                                value={newStrat.selectedSources.length === 0 ? '74%' : `${previewData.confidence_score}%`} 
                                                subtext="calibration"
                                            />
                                        </div>
                          

                                        {/* FIX 7: Preview Visual Upgrade (Chart & Confidence Bar) */}
                                        <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp size={14} className="text-primary" /> 
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Projected Performance</span>
                                                </div>
                                                <div className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-40">7-Day Simulation</div>
                                            </div>
                                            <div className="h-20 w-full flex items-center justify-center bg-black/20 rounded-xl border border-white/5 p-4 mb-4">
                                                <Sparkline 
                                                    data={newStrat.selectedSources.length === 0 ? [5, 12, 8, 15, 25, 20, 32] : [10, 18, 14, 22, 35, 28, 42]} 
                                                    color="#3b82f6" 
                                                    width={300} 
                                                    height={60} 
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Intelligence Confidence</span>
                                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                                        {newStrat.selectedSources.length === 0 ? '74%' : `${previewData.confidence_score}%`}
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px] relative">
                                                    {/* Gradient Confidence Bar (Red to Green) */}
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-danger via-amber-500 to-success shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                                                        style={{ width: `${newStrat.selectedSources.length === 0 ? 74 : previewData.confidence_score}%` }} 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Intelligence Feed (Merged & Actionable) */}
                                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden group">
                                            <div className="flex items-center gap-2.5 mb-4 relative z-10">
                                                <Zap size={14} className="text-primary animate-pulse" fill="currentColor" />
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Intelligence Stream</h4>
                                            </div>
                                            <div className="space-y-4 relative z-10">
                                                {(newStrat.selectedSources.length > 0 ? previewData.recent_signals : [
                                                    "🐳 Whale identified: 0x42... entering 'Yes' on ETH ETF Approval",
                                                    "🎯 Sniper 0x1A... just took a size position on 'US Election Results'",
                                                    "⚡ Momentum shift detected in 'Fed Rate Decision' market"
                                                ]).map((sig, i) => (
                                                    <div key={sig} className="flex items-start gap-3 text-[10px] text-white/80 font-medium leading-relaxed italic animate-in fade-in slide-in-from-left-2" style={{ transitionDelay: `${i * 150}ms` }}>
                                                        <div className="mt-1.5 w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                                                        {sig}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Subtle Decorative Gradient */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full -mr-16 -mt-16" />
                                        </div>

                                        {/* Source Context (Only if active) */}
                                        {newStrat.selectedSources.length > 0 && (
                                            <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 animate-in fade-in duration-500">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Users size={14} className="text-white/40" />
                                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40">Active Oracles</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {newStrat.selectedSources.map(addr => {
                                                        const src = settings.copy_sources.find(s => s.address === addr);
                                                        return (
                                                            <div key={addr} className="flex items-center gap-2 bg-white/5 py-1.5 px-2.5 rounded-lg border border-white/5 hover:border-primary/30 transition-all">
                                                                <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary">
                                                                    {src?.name?.charAt(0) || 'W'}
                                                                </div>
                                                                <span className="text-[9px] font-bold text-white/70">{src?.name || addr.substring(0, 6)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FIX 8: CompactStats (Simplified Gamification) */}
            <div className="mb-14">
                <div className="glass-panel-unified p-4 flex items-center justify-between border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-8 px-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                                <Award size={16} />
                            </div>
                            <div>
                                <div className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-0.5 opacity-40">Global Rank</div>
                                <div className="text-sm font-black text-white">#{portfolio.global_rank || '1,284'}</div>
                            </div>
                        </div>
                        
                        <div className="w-px h-8 bg-white/5" />
                        
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent/10 text-accent border border-accent/20">
                                <Target size={16} />
                            </div>
                            <div>
                                <div className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-0.5 opacity-40">Weekly Goal</div>
                                <div className="text-sm font-black text-white">${portfolio.total_pnl.toFixed(0)} / $400</div>
                            </div>
                        </div>
                        
                        <div className="w-px h-8 bg-white/5" />
                        
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-profit/10 text-profit border border-profit/20">
                                <Flame size={16} />
                            </div>
                            <div>
                                <div className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-0.5 opacity-40">Win Streak</div>
                                <div className="text-sm font-black text-profit">{portfolio.accuracy > 70 ? '5+' : '3'} Wins</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 px-6 border-l border-white/5">
                        <div className="text-right">
                            <div className="text-[8px] font-black text-muted uppercase tracking-widest mb-1 opacity-40">Next Milestone</div>
                            <div className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Zap size={10} className="text-primary" /> Top 1,000
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FIX 6 & 10: Social Proof & Actionable AI Sidekick (Repositioned) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                {/* Social Proof: Signal Feed */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group">
                                <Globe size={18} className="group-hover:rotate-12 transition-transform" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Institutional Signal Feed</h3>
                                <div className="flex items-center gap-3 text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> 2,341 members active</span>
                                    <div className="w-1 h-1 bg-white/10 rounded-full" />
                                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-primary rounded-full" /> $1.2M total returns generated</span>
                                </div>
                            </div>
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

                {/* AI Sidekick: Actionable Insights */}
                <div className="lg:col-span-4">
                    <div className="glass-panel-unified iridescent-border h-full flex flex-col" style={{ padding: '2rem' }}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                <Zap size={18} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">AI Insights</h3>
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">actionable alpha</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6 flex-1">
                            <div className="p-5 bg-accent/5 rounded-2xl border border-accent/20 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="text-[10px] font-black text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Flame size={12} /> Alpha Opportunity
                                    </div>
                                    <p className="text-[11px] text-white/90 leading-relaxed font-medium mb-6">Whale clusters are pivoting to 'Entertainment' markets. This historically precedes a 15% ROI spike in momentum strategies.</p>
                                    
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={() => applyTemplate(STRATEGY_TEMPLATES[2])}
                                            className="w-full py-3 bg-accent/20 hover:bg-accent/30 text-accent text-[9px] font-black uppercase tracking-widest rounded-xl border border-accent/30 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check size={12} /> Apply Optimization
                                        </button>
                                        <button 
                                            onClick={() => recommendTraders()}
                                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
                                        >
                                            Auto-Inject Sources
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Confidence Score</span>
                                    <span className="text-sm font-black text-white">82%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                    <div className="h-full bg-primary shadow-[0_0_15px_rgba(59,130,246,0.4)] rounded-full" style={{ width: '82%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* FIX 9: Cleaned Active Strategies (Collapsed if empty) */}
            {strategies.length > 0 && (
                <div className="mb-14 animate-in slide-in-from-bottom-5 duration-700">
                    <div className="flex items-center justify-between mb-8 opacity-60 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2.5">
                            <Activity size={18} className="text-primary" />
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Operational Units</h3>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">{strategies.filter(s => s.status === 'active').length} Synchronized</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {strategies.map((s, idx) => (
                            <div key={idx} className="glass-panel-unified group hover:bg-white/[0.03] hover:border-primary/20 transition-all duration-300 overflow-hidden" style={{ padding: '0' }}>
                                <div className="flex flex-col md:flex-row md:items-center">
                                    {/* Left: Unit Info */}
                                    <div className="flex-1 p-5 flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/5">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted'} transition-all group-hover:scale-110 shadow-lg shadow-black/20`}>
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-black text-white tracking-tight">{s.name}</h4>
                                                <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-white/10'}`} />
                                            </div>
                                            <div className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">{s.platform} • {s.riskMode || 'Balanced'}</div>
                                        </div>
                                    </div>

                                    {/* Center: Performance */}
                                    <div className="px-8 py-5 flex items-center gap-10 border-b md:border-b-0 md:border-r border-white/5">
                                        <div className="hidden sm:block">
                                            <div className="text-[8px] font-black text-muted uppercase tracking-widest mb-1 opacity-40">Capital</div>
                                            <div className="text-sm font-black text-white">${parseFloat(s.strategy_balance || 0).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-black text-muted uppercase tracking-widest mb-1 opacity-40">Return</div>
                                            <div className={`text-sm font-black flex items-center gap-1.5 ${s.simulated_pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                                                {s.simulated_pnl >= 0 ? '+' : '-'}${Math.abs(parseFloat(s.simulated_pnl || 0)).toFixed(2)}
                                                <span className="text-[8px] opacity-40">(7.2%)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="p-5 flex items-center justify-between md:justify-end gap-5 bg-white/[0.01]">
                                        <div className="flex items-center gap-1.5">
                                            <button 
                                                onClick={() => toggleStrategy(s.strategy_id, s.status)}
                                                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-md ${s.status === 'active' ? 'bg-danger/10 text-danger hover:bg-danger/20' : 'bg-success/10 text-success hover:bg-success/20'}`}
                                            >
                                                {s.status === 'active' ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                            </button>
                                            <button 
                                                onClick={() => viewTrades(s.strategy_id)}
                                                className="w-9 h-9 flex items-center justify-center bg-white/5 text-muted hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                            >
                                                <BarChart3 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => removeStrategy(s.strategy_id)}
                                                className="w-9 h-9 flex items-center justify-center bg-danger/5 text-danger/30 hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


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

export default StrategySandbox;
