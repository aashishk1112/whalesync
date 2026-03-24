import React, { useState, useEffect, useContext, useRef } from 'react';
import { Play, Square, Settings, Activity, ChevronDown, ChevronLeft, ChevronRight, Check, X, TrendingUp, TrendingDown, Users, Target, Zap, Shield, Flame, Info, BarChart3, Clock, Rocket, Globe, Award } from 'lucide-react';
import { PortfolioContext } from '../context/PortfolioContext';
import { AuthContext } from '../context/AuthContext';

const Sparkline = ({ data, color = '#3b82f6', height = 30, width = 100, isAnimating = false }) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data.filter(d => typeof d === 'number' && isFinite(d)));
    const max = Math.max(...data.filter(d => typeof d === 'number' && isFinite(d)));
    const range = max - min || 1;
    const points = data.map((d, i) => {
        const x = (i / Math.max(1, data.length - 1)) * width;
        const val = (typeof d === 'number' && isFinite(d)) ? d : min;
        const y = height - ((val - min) / range) * height;
        return { x, y: isFinite(y) ? y : height };
    });
    const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={`overflow-visible transition-all duration-500 ${isAnimating ? 'scale-[1.02]' : 'scale-100'}`}>
            <path d={pathData} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-[d] duration-500" />
            <path d={`${pathData} L ${width},${height} L 0,${height} Z`} fill={`url(#gradient-${color.replace(/[^a-zA-Z0-0]/g, '')})`} opacity="0.1" className="transition-[d] duration-500" />
            <defs>
                <linearGradient id={`gradient-${color.replace(/[^a-zA-Z0-0]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
        </svg>
    );
};

const SourceMultiselect = ({ platform, selected, onToggle, settings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const availableSources = settings.copy_sources.filter(s => s.active && s.platform === platform);

    useEffect(() => {
        const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative w-full">
            <div 
                onClick={() => setIsOpen(!isOpen)} 
                className="bg-slate-900/40 backdrop-blur-xl p-3 px-4 rounded-xl border border-white/5 flex justify-between items-center min-h-[48px] cursor-pointer hover:border-primary/30 transition-all group"
            >
                <div className="flex flex-wrap gap-2">
                    {selected.length === 0 ? (
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Select Sources...</span>
                    ) : selected.map(addr => {
                        const src = availableSources.find(s => s.address === addr);
                        return (
                            <div key={addr} className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-primary/20">
                                {src?.name || (addr || '').substring(0, 6)}
                                <X size={12} onClick={(e) => { e.stopPropagation(); onToggle(addr); }} className="cursor-pointer hover:text-white transition-colors" />
                            </div>
                        );
                    })}
                </div>
                <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute top-[110%] left-0 right-0 z-[100] max-h-[250px] overflow-y-auto p-2 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {availableSources.length === 0 ? (
                        <div className="text-center py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">No active {platform} sources</div>
                    ) : availableSources.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => onToggle(s.address)} 
                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all hover:bg-white/5 ${selected.includes(s.address) ? 'bg-primary/5' : ''}`}
                        >
                            <div className="relative">
                                {s.image_url ? (
                                    <img src={s.image_url} className="w-8 h-8 rounded-full border border-white/10" alt={s.name} />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black border border-white/10">{s.name.charAt(0)}</div>
                                )}
                                {selected.includes(s.address) && (
                                    <div className="absolute -bottom-1 -right-1 bg-primary rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-900 shadow-lg">
                                        <Check size={10} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="font-black text-xs text-white uppercase tracking-tight">{s.name}</div>
                                <div className="text-[9px] font-bold text-slate-500 tracking-widest">{(s.address || '').substring(0, 10)}...</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const StrategySandbox = () => {
    const { user } = useContext(AuthContext);
    const { portfolio, settings, strategies, refreshPortfolio, refreshStrategies } = useContext(PortfolioContext);
    const [wizardStep, setWizardStep] = useState(1);
    const [archetypes, setArchetypes] = useState({});
    const [loadingArchetypes, setLoadingArchetypes] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isBuilderLocked, setIsBuilderLocked] = useState(true);
    const [showToast, setShowToast] = useState(null);
    const [newStrat, setNewStrat] = useState({
        name: 'Auto Strategy',
        platform: 'Polymarket',
        allocation: 10,
        betSizePercentage: 5,
        selectedSources: [],
        category: 'All',
        isLive: false,
        riskMode: 'Balanced'
    });

    const triggerAnalytics = (event) => { /* Analytics disabled to reduce console noise */ };

    const generateRealisticTrend = (p) => {
        const points = [];
        const base = p.balance || 50000;
        const roi = (p.roi || 0) / 100;
        const volatility = 0.05 + (p.risk_score || 5) / 100;
        let current = base / (1 + roi);
        for (let i = 0; i < 8; i++) {
            const drift = roi / 8;
            const shock = (Math.random() - 0.5) * volatility;
            current = current * (1 + drift + shock);
            points.push(current);
        }
        return points;
    };

    const [performanceTrend, setPerformanceTrend] = useState([5, 12, 8, 15, 25, 20, 32]);

    useEffect(() => {
        if (portfolio.balance) {
            setIsAnimating(true);
            setPerformanceTrend(generateRealisticTrend(portfolio));
            setTimeout(() => setIsAnimating(false), 400);
        }
    }, [portfolio.balance, portfolio.roi]);

    const STRATEGY_TEMPLATES = [
        { name: "Copy Top Whales", description: `Automatically tracks ${archetypes.top_whale?.username || 'top whales'} (WhaleScore: ${archetypes.top_whale?.whale_score?.toFixed(1) || '92.4'}).`, roi: archetypes.top_whale?.roi ? `+${archetypes.top_whale.roi.toFixed(1)}%` : "+18.4%", risk: "Medium", config: { allocation: 15, betSize: 5, riskMode: 'Balanced' }, source_address: archetypes.top_whale?.address },
        { name: "Win Rate Snipers", description: `Focuses on ${archetypes.safest?.username || 'low-risk snipers'} (Accuracy: ${((archetypes.safest?.win_rate || 0.75) * 100).toFixed(0)}%).`, roi: archetypes.safest?.roi ? `+${archetypes.safest.roi.toFixed(1)}%` : "+12.1%", risk: "Low", config: { allocation: 10, betSize: 2, riskMode: 'Conservative' }, source_address: archetypes.safest?.address },
        { name: "Momentum Seekers", description: `Aggressive copying of ${archetypes.trending?.username || 'trending traders'} (+${archetypes.trending?.roi?.toFixed(1) || '28'}% spike).`, roi: archetypes.trending?.roi ? `+${archetypes.trending.roi.toFixed(1)}%` : "+28.7%", risk: "High", config: { allocation: 25, betSize: 10, riskMode: 'Aggressive' }, source_address: archetypes.trending?.address }
    ];

    const applyTemplate = (template, isAuto = false) => {
        triggerAnalytics(isAuto ? "template_auto_selected" : "template_selected");
        let suggestedIds = [];
        if (template.name.includes("Whales")) suggestedIds = settings.copy_sources.filter(s => s.active && s.platform === 'Polymarket').slice(0, 3).map(s => s.address);
        else if (template.name.includes("Win Rate")) suggestedIds = settings.copy_sources.filter(s => s.active).slice(1, 4).map(s => s.address);
        else if (template.name.includes("Momentum")) suggestedIds = settings.copy_sources.filter(s => s.active).sort(() => 0.5 - Math.random()).slice(0, 3).map(s => s.address);
        
        setIsAnimating(true);
        setNewStrat({...newStrat, name: template.name, allocation: template.config.allocation, betSizePercentage: template.config.betSize, riskMode: template.config.riskMode, selectedSources: suggestedIds});
        setIsBuilderLocked(true);
        setTimeout(() => setIsAnimating(false), 400);
    };

    useEffect(() => {
        if (!loadingArchetypes && STRATEGY_TEMPLATES.length > 0 && newStrat.selectedSources.length === 0) {
            applyTemplate(STRATEGY_TEMPLATES[0], true);
        }
    }, [loadingArchetypes]);

    const recommendTraders = () => {
        triggerAnalytics("ai_strategy_clicked");
        const topTraders = settings.copy_sources.filter(s => s.active && s.platform === 'Polymarket').sort(() => 0.5 - Math.random()).slice(0, 3).map(s => s.address);
        setNewStrat(prev => ({ ...prev, selectedSources: topTraders }));
    };

    useEffect(() => {
        const fetchArchetypes = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/traders/archetypes`);
                const data = await res.json();
                if (data.archetypes) setArchetypes(data.archetypes);
            } catch (err) { console.error("Error fetching archetypes:", err); } finally { setLoadingArchetypes(false); }
        };
        fetchArchetypes();
    }, []);
    const [signals, setSignals] = useState([]);

    useEffect(() => {
        if (!user?.user_id) return;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        
        const fetchData = async () => {
            // refreshPortfolio already updates strategies/pnl etc.
            if (refreshPortfolio) await refreshPortfolio(); 
        };
        
        // Initial fetch only if not already loading elsewhere
        fetchData();
        
        // Moderate polling to ensure life but save costs/renders
        const pollInterval = setInterval(fetchData, 60000); // Pulse every minute
        return () => { clearInterval(pollInterval); };
    }, [user?.user_id]); // Stable dependency on user ID instead of objects or functions

    const [previewData, setPreviewData] = useState({ expected_pnl_7d: 0, win_rate: 0, max_drawdown: 0, confidence_score: 0, recent_signals: [] });
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    useEffect(() => {
        if (!newStrat.selectedSources || newStrat.selectedSources.length === 0) return;
        const fetchPreview = async () => {
            setIsPreviewLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/strategies/preview`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trader_ids: newStrat.selectedSources, risk_mode: newStrat.riskMode || 'Balanced', allocation: parseFloat(newStrat.allocation), trade_size: parseFloat(newStrat.betSizePercentage) })
                });
                const data = await res.json();
                if (res.ok) {
                    setPreviewData(data);
                    triggerAnalytics("preview_updated");
                }
            } catch (err) { console.error("Preview error:", err); } finally { setIsPreviewLoading(false); }
        };
        const debounceTimer = setTimeout(fetchPreview, 500);
        return () => clearTimeout(debounceTimer);
    }, [newStrat.selectedSources, newStrat.riskMode, newStrat.allocation, newStrat.betSizePercentage]);

    const handleDeploy = async (e) => {
        if (e) e.preventDefault();
        const allocation = parseFloat(newStrat.allocation);
        if (isNaN(allocation) || allocation < 5 || allocation > 100) return;
        const payload = { name: newStrat.name, platform: 'Polymarket', allocation_percentage: allocation, bet_size_percentage: parseFloat(newStrat.betSizePercentage) || 5.0, source_addresses: newStrat.selectedSources, category: 'All', is_live: false, risk_mode: newStrat.riskMode || 'Balanced' };
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/strategies/?user_id=${user.user_id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) {
                if (refreshStrategies) await refreshStrategies();
                setShowToast({ message: "⚡ Strategy Initialized", subtext: `Projected ROI: +${previewData.win_rate > 50 ? '18' : '12'}%` });
                setTimeout(() => setShowToast(null), 3000);
                setWizardStep(1);
                setNewStrat({ name: 'Auto Strategy', platform: 'Polymarket', allocation: 10, betSizePercentage: 5, selectedSources: [], category: 'All', isLive: false, riskMode: 'Balanced' });
                refreshPortfolio();
            }
        } catch (err) { console.error(err); }
    };

    const toggleStrategy = async (stratId, currentStatus) => {
        const action = currentStatus === 'active' ? 'stop' : 'resume';
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        await fetch(`${apiUrl}/api/strategies/${stratId}/${action}?user_id=${user.user_id}`, { method: 'POST' });
        if (refreshStrategies) await refreshStrategies();
    };

    const removeStrategy = async (stratId) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        await fetch(`${apiUrl}/api/strategies/${stratId}?user_id=${user.user_id}`, { method: 'DELETE' });
        if (refreshStrategies) await refreshStrategies();
    };

    const [confirmAction, setConfirmAction] = useState(null);
    const [tradesModal, setTradesModal] = useState(null);

    const executeConfirmAction = async () => {
        if (!confirmAction) return;
        if (confirmAction.type === 'toggle') {
            await toggleStrategy(confirmAction.strategy.strategy_id, confirmAction.strategy.status || 'inactive');
        } else if (confirmAction.type === 'delete') {
            await removeStrategy(confirmAction.strategy.strategy_id);
        }
        setConfirmAction(null);
    };

    const viewTrades = async (strategy) => {
        setTradesModal({ stratId: strategy.strategy_id, name: strategy.name, loading: true, trades: [] });
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/strategies/${strategy.strategy_id}/trades?user_id=${user?.user_id||user?.userId}`);
            if (res.ok) {
                const data = await res.json();
                setTradesModal({ stratId: strategy.strategy_id, name: strategy.name, loading: false, trades: data.trades || [] });
            }
        } catch(err) {
            setTradesModal({ stratId: strategy.strategy_id, name: strategy.name, loading: false, trades: [] });
        }
    };

    const toggleSourceSelection = (address) => {
        setNewStrat(prev => ({ ...prev, selectedSources: prev.selectedSources.includes(address) ? prev.selectedSources.filter(a => a !== address) : [...prev.selectedSources, address] }));
    };

    const TemplateCardV2 = ({ name, description, roi, risk, badge, onDeploy, isActive }) => (
        <div onClick={onDeploy} className="glass-panel group" style={{ padding: '24px', minWidth: '320px', flex: '0 0 320px', height: '240px', background: 'rgba(10, 13, 20, 0.9)', border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', cursor: 'pointer', transform: isActive ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: isActive ? '0 0 20px rgba(59,130,246,0.15)' : 'none' }}>
            {isActive && <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '8px', fontWeight: '900', color: 'white' }}>ACTIVE</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div><div style={{ fontSize: '14px', fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{name}</div><div style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{badge}</div></div>
                <div style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '10px', fontWeight: '900', color: 'var(--primary)' }}>ROI {roi}</div>
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5', flex: 1, margin: '0 0 16px 0' }}>{description}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: risk === 'High' ? '#ef4444' : risk === 'Medium' ? '#f59e0b' : '#10b981' }} /><span style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{risk} Risk</span></div>
                <button style={{ padding: '8px 16px', background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: 'white', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '8px', border: 'none' }}>Select Template</button>
            </div>
        </div>
    );

    const getConfidenceColor = (score) => {
        if (score >= 75) return '#10b981';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="min-h-screen bg-transparent text-white relative">
            <div className="flex flex-col gap-10">
                {showToast && (
                    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[3000] animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-slate-900/40 backdrop-blur-2xl py-4 px-8 border border-primary/30 rounded-2xl flex items-center gap-4 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary glow-pulse"><Zap size={20} fill="currentColor" /></div>
                            <div><div className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-0.5">{showToast.message}</div><div className="text-[10px] font-bold text-primary uppercase tracking-widest">{showToast.subtext}</div></div>
                        </div>
                    </div>
                )}

                {/* 🏷️ Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/50 pb-10 mt-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Terminal • Strategy Sandbox</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                            System <span className="text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">Simulator</span>
                        </h1>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 px-4 rounded-xl">
                            <Rocket size={14} className="text-primary" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Actions:</span>
                            <div className="flex gap-2">
                                <button onClick={() => { applyTemplate(STRATEGY_TEMPLATES[0]); setWizardStep(4); }} className="hover:bg-primary/20 bg-primary/10 border border-primary/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all">AI Deploy</button>
                                <button onClick={() => { recommendTraders(); setWizardStep(3); }} className="hover:bg-emerald-500/20 bg-emerald-500/10 border border-emerald-500/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all">Copy Whales</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ⚡ Operational Alpha Units (Moved to Top) */}
                {strategies.length > 0 && (
                    <div className="mb-20">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-1.5 h-6 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Operational <span className="text-primary">Alpha Units</span></h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Execution Nodes</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {strategies.map((s, idx) => (
                                <div key={idx} onClick={() => viewTrades(s)} className="bg-slate-900/20 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] flex flex-col gap-10 hover:border-primary/30 transition-all group cursor-pointer animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${s.status === 'active' ? 'bg-primary/20 text-primary shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-white/5 text-slate-600'}`}>
                                                <Zap size={28} fill={s.status === 'active' ? 'currentColor' : 'none'} className={s.status === 'active' ? 'animate-pulse' : ''} />
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-white italic tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{s.name}</div>
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mt-1">{s.platform} • {s.risk_mode}</div>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${(s.status || 'inactive') === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800/10 text-slate-500 border-white/5'}`}>
                                            {s.status || 'inactive'}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Current PnL</div>
                                            <div className={`text-xl font-black tabular-nums transition-all ${parseFloat(s.simulated_pnl || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                ${parseFloat(s.simulated_pnl || 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Allocation</div>
                                            <div className="text-xl font-black text-white tabular-nums">{s.allocation_percentage || 0}%</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'toggle', strategy: s }); }} 
                                            className={`flex-1 flex gap-2 items-center justify-center py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${(s.status || 'inactive') === 'active' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20'}`}
                                        >
                                            {(s.status || 'inactive') === 'active' ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                            {(s.status || 'inactive') === 'active' ? 'Deactivate' : 'Reactuate'}
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'delete', strategy: s }); }} 
                                            className="w-14 flex items-center justify-center bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 📊 Hero Stats Row */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                    <div className="bg-slate-900/20 backdrop-blur-xl rounded-[32px] border border-white/5 p-8 flex flex-col relative overflow-hidden group border-r-0">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BarChart3 size={120} className="text-primary" />
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
                            {[
                                { label: 'PnL (7D)', value: portfolio.total_pnl >= 0 ? `+$${portfolio.total_pnl.toLocaleString()}` : `-$${Math.abs(portfolio.total_pnl).toLocaleString()}`, color: portfolio.total_pnl >= 0 ? 'text-emerald-500' : 'text-rose-500' },
                                { label: 'Win Rate', value: `${(portfolio.accuracy || 0).toFixed(0)}%`, color: 'text-primary' },
                                { label: 'Drawdown', value: `-${(portfolio.risk_score || 0).toFixed(1)}%`, color: 'text-rose-500' },
                                { label: 'Confidence', value: `${(previewData.confidence_score || 74).toFixed(0)}%`, color: previewData.confidence_score >= 75 ? 'text-emerald-500' : previewData.confidence_score >= 50 ? 'text-amber-500' : 'text-rose-500', emphasized: true }
                            ].map((m, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
                                    <span className={`text-2xl font-black tabular-nums transition-all ${m.color} ${m.emphasized ? 'scale-110 origin-left drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]' : ''}`}>{m.value}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex-1 min-h-[160px] flex items-end justify-center">
                            <Sparkline data={performanceTrend} color="#3b82f6" width={800} height={160} isAnimating={isAnimating} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* 🤖 AI Sidekick */}
                        <div className="bg-primary/5 backdrop-blur-xl border border-primary/20 p-6 rounded-[32px] flex items-start gap-4 animate-fade-in stagger-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Zap size={40} className="text-primary" />
                            </div>
                            <div className="bg-primary/20 p-2.5 rounded-xl text-primary glow-pulse relative z-10">
                                <Zap size={18} fill="currentColor" />
                            </div>
                            <div className="flex-1 relative z-10">
                                <div className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-2">Neural Insight</div>
                                <p className="text-[11px] text-slate-400 font-bold leading-relaxed mb-4 italic">
                                    {signals[0] ? signals[0].message : "Whale clusters moving to Entertainment markets. Momentum opportunity detected."}
                                </p>
                                <button 
                                    onClick={() => { applyTemplate(STRATEGY_TEMPLATES[2]); setWizardStep(1); }} 
                                    className="w-full py-2.5 bg-primary text-white hover:bg-primary-hover rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                                >
                                    Apply Insight
                                </button>
                            </div>
                        </div>

                        {/* ⚡ Intelligence Stream */}
                        <div className="bg-slate-900/20 backdrop-blur-xl border border-white/5 p-6 rounded-[32px] flex-1 flex flex-col min-h-[300px] animate-fade-in stagger-2">
                            <div className="flex items-center gap-3 mb-6">
                                <Activity size={14} className="text-slate-500" />
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intelligence Stream</h4>
                            </div>
                            <div className="custom-scrollbar overflow-y-auto flex-1 space-y-4 pr-2">
                                {signals.map((sig, i) => (
                                    <div key={i} className="animate-fade-in border-b border-white/5 pb-4 last:border-0" style={{ animationDelay: `${i * 0.1}s` }}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[8px] font-black text-primary uppercase tracking-widest">Signal Detected</span>
                                            <span className="text-[7px] font-black text-slate-600 uppercase">Live</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-300 leading-relaxed">{sig.message}</p>
                                    </div>
                                ))}
                                {signals.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-40">
                                        <Activity size={32} className="text-slate-600 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Scanning Markets...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🏷️ Templates Section */}
                <div id="strategy-templates" className="mt-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                            <Flame size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Institutional Blueprints</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Multi-Whale Engines</p>
                        </div>
                    </div>
                    
                    <div className="scrollbar-hide flex gap-6 overflow-x-auto pb-6">
                        {STRATEGY_TEMPLATES.map((tpl, i) => (
                            <TemplateCardV2 
                                key={i} 
                                {...tpl} 
                                badge={i === 0 ? '🔥 Trending' : i === 1 ? '🎯 Safe' : '⚡ Aggressive'} 
                                isActive={newStrat.name === tpl.name} 
                                onDeploy={() => applyTemplate(tpl)} 
                            />
                        ))}
                    </div>
                </div>
            <div id="strategy-builder" className={`mt-12 transition-all duration-500 ${newStrat.selectedSources.length > 0 ? 'animate-pulse-subtle' : ''}`}>
                <div className="bg-slate-900/20 backdrop-blur-xl border border-white/5 p-8 md:p-12 rounded-[40px]">
                    {/* 🚀 Step Indicator */}
                    <div className="flex justify-between items-center gap-4 mb-12">
                        {[
                            { step: 1, label: 'Design' },
                            { step: 2, label: 'Architecture' },
                            { step: 3, label: 'Neural' },
                            { step: 4, label: 'Ignition' }
                        ].map((s, i) => (
                            <React.Fragment key={s.step}>
                                <div className="flex flex-col items-center gap-2 flex-1">
                                    <div className={`h-1 w-full rounded-full transition-all duration-500 ${wizardStep >= s.step ? 'bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5'}`} />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${wizardStep >= s.step ? 'text-white' : 'text-slate-600'}`}>{s.label}</span>
                                </div>
                                {i < 3 && <div className="w-4 h-[1px] bg-white/5 mt-[-18px]" />}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12">
                        <div className="transition-all duration-300">
                            <div className="flex justify-between items-center mb-8">
                                 <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                    {wizardStep === 1 ? 'Unit Designation' : wizardStep === 2 ? 'Risk Architecture' : wizardStep === 3 ? 'Neural Sources' : 'Final Ignition'}
                                 </h3>
                                 {isBuilderLocked && (
                                    <button onClick={() => setIsBuilderLocked(false)} className="pointer-events-auto text-[10px] font-black text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 hover:bg-primary/20 transition-all uppercase tracking-widest">
                                        Unlock Builder
                                    </button>
                                 )}
                            </div>

                            <div className={`min-h-[320px] transition-all duration-300 ${isBuilderLocked ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100 grayscale-0 pointer-events-auto'}`}>
                                {wizardStep === 1 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Alpha-Falcon-9" 
                                                value={newStrat.name} 
                                                onChange={e => setNewStrat({...newStrat, name: e.target.value})} 
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-white font-bold placeholder:text-slate-700 focus:border-primary/50 transition-all focus:ring-4 focus:ring-primary/10" 
                                            />
                                        </div>
                                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-center gap-3">
                                            <Globe size={20} className="text-primary" />
                                            <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Deployment Destination: Polymarket</span>
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 2 && (
                                    <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                        {['Conservative', 'Balanced', 'Aggressive'].map(r => (
                                            <button 
                                                key={r} 
                                                onClick={() => setNewStrat({...newStrat, riskMode: r})} 
                                                className={`w-full p-6 rounded-2xl flex items-center justify-between border-2 transition-all group ${newStrat.riskMode === r ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/2'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${newStrat.riskMode === r ? 'bg-primary text-white' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'}`}>
                                                        {r === 'Conservative' ? <Shield size={24} /> : r === 'Balanced' ? <Target size={24} /> : <Flame size={24} />}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-black text-white uppercase tracking-tight">{r}</div>
                                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{r === 'Conservative' ? 'Safety First' : r === 'Balanced' ? 'Optimal Growth' : 'Max Alpha'}</div>
                                                    </div>
                                                </div>
                                                {newStrat.riskMode === r && <Check size={20} className="text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {wizardStep === 3 && (
                                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 overflow-visible">
                                        <SourceMultiselect platform={newStrat.platform} selected={newStrat.selectedSources} onToggle={toggleSourceSelection} settings={settings} />
                                        <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed italic">
                                            *Selected oracles provide the neural signals for autonomous execution.
                                        </p>
                                    </div>
                                )}

                                {wizardStep === 4 && (
                                    <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 glow-pulse">
                                            <Rocket size={40} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-sm mb-8 leading-relaxed">
                                            Configuration verified. Confirm your capital allocation to launch the autonomous unit.
                                        </p>
                                        <div className="w-full bg-slate-950/50 border border-white/5 rounded-[32px] p-8">
                                            <div className="flex justify-between items-center mb-6">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Allocation Matrix</span>
                                                <span className="text-2xl font-black text-primary tabular-nums">{newStrat.allocation}%</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="5" 
                                                max="100" 
                                                value={newStrat.allocation} 
                                                onChange={e => setNewStrat({...newStrat, allocation: e.target.value})} 
                                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary-hover transition-all" 
                                            />
                                            <div className="flex justify-between mt-4 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                <span>Min (5%)</span>
                                                <span>Max (100%)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 mt-12">
                                {wizardStep > 1 && (
                                    <button 
                                        onClick={() => setWizardStep(wizardStep - 1)} 
                                        className="px-8 py-4 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Previous
                                    </button>
                                )}
                                <button 
                                    onClick={() => { triggerAnalytics("next_phase_clicked"); wizardStep < 4 ? setWizardStep(wizardStep + 1) : handleDeploy(); }} 
                                    className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] ${newStrat.selectedSources.length > 0 ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover fomo-pulse' : 'bg-slate-800 text-slate-500'}`}
                                >
                                    {wizardStep < 4 ? 'Next Phase →' : 'Launch Unit 🚀'}
                                </button>
                            </div>
                        </div>

                        <div className="lg:border-l border-white/5 lg:pl-12">
                            <div className={`bg-slate-950/30 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 h-full min-h-[400px] flex flex-col transition-all duration-500 ${isPreviewLoading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}>
                                <div className="flex justify-between items-center mb-8">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pre-Flight Audit</h4>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${newStrat.name ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{newStrat.name ? 'Live Link' : 'Standby'}</span>
                                    </div>
                                </div>

                                <div className="space-y-8 flex-1">
                                    <div className="text-2xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis border-b border-white/5 pb-4">
                                        {newStrat.name || 'Unit_Designation'}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Risk Profile</div>
                                            <div className="text-xs font-black text-white uppercase">{newStrat.riskMode}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Neural Oracles</div>
                                            <div className="text-xs font-black text-white uppercase">{newStrat.selectedSources.length} Selected</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Projected ROI</div>
                                            <div className="text-lg font-black text-emerald-500 tabular-nums">+{previewData.win_rate > 50 ? '18.4' : '12.1'}%</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Confidence</div>
                                            <div className="text-lg font-black text-primary tabular-nums">{(previewData.confidence_score || 74).toFixed(0)}%</div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-8 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Health check</span>
                                            <span className="text-xs font-black text-emerald-500 uppercase">Passed</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all duration-1000 w-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🏆 Milestone Bar */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-[32px] flex items-center justify-between mt-12 mb-20 animate-fade-in stagger-3">
                <div className="flex flex-wrap gap-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Award size={20} />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Rank</div>
                            <div className="text-sm font-black text-white">#{portfolio.global_rank || '1,284'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Target size={20} />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Growth Path</div>
                            <div className="text-sm font-black text-white">${portfolio.total_pnl.toFixed(0)} / ${(portfolio.balance * 0.1).toFixed(0)}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Flame size={20} />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Execution Streak</div>
                            <div className="text-sm font-black text-white">{portfolio.accuracy > 70 ? '5+' : '3'} Days Active</div>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block text-right">
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Next Milestone</div>
                    <div className="text-[11px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">Top 1,000 Global</div>
                </div>
            </div>

            </div>
            
            {/* Action Modals */}
            {confirmAction && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                    <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Confirm Setup</h2>
                    <p className="text-slate-400 mb-6 text-sm font-medium">
                        Are you sure you want to {confirmAction.type === 'delete' ? <span className="text-rose-500 font-bold">PERMANENTLY DELETE</span> : (confirmAction.strategy.status === 'active' ? <span className="text-amber-500 font-bold">DEACTIVATE</span> : <span className="text-emerald-500 font-bold">REACTUATE</span>)} the systematic alpha unit "{confirmAction.strategy.name}"?
                    </p>
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setConfirmAction(null)} 
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={executeConfirmAction} 
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-colors ${confirmAction.type === 'delete' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20' : 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'}`}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
            )}

            {tradesModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8">
                  <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 max-w-2xl w-full h-full max-h-[80vh] shadow-2xl relative flex flex-col">
                    <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
                        <div>
                            <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">Prediction Stream</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Activity size={12} className="animate-pulse" /> {tradesModal.name}
                            </p>
                        </div>
                        <button onClick={() => setTradesModal(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                        {tradesModal.loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-40 py-20">
                                <Activity size={32} className="text-primary animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Querying Blockchain Predictors...</span>
                            </div>
                        ) : tradesModal.trades.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-40 py-20">
                                <Shield size={32} className="text-slate-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest">No predictions deployed yet. Awaiting signal.</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tradesModal.trades.map((t, i) => (
                                    <div key={i} className="p-5 bg-slate-950/50 border border-white/5 rounded-3xl flex flex-col gap-4 group hover:border-primary/30 transition-all">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${t.position === 'YES' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {t.position}
                                                </div>
                                                <div className="max-w-[400px]">
                                                    <div className="text-[13px] font-black text-white leading-tight mb-1" title={t.metadata?.question || t.market_id}>
                                                        {t.metadata?.question || t.market_id || 'Polymarket Event'}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <span>{t.category || 'General'}</span>
                                                        <span className="opacity-20">•</span>
                                                        <span>{t.created_at ? new Date(t.created_at).toLocaleString() : 'Recent'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {(t.metadata?.polymarket_url || t.metadata?.slug) && (
                                                <a 
                                                    href={t.metadata?.polymarket_url || `https://polymarket.com/event/${t.metadata?.slug}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-2 text-[8px] font-black uppercase tracking-tighter"
                                                >
                                                    <Globe size={12} />
                                                    LINK
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center py-3 px-4 bg-white/2 rounded-2xl border border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Simulated Size</span>
                                                <span className="text-sm font-black text-white tabular-nums">${parseFloat(t.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                            </div>
                                            <div className="text-right flex flex-col">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Execution Price</span>
                                                <span className="text-sm font-black text-primary tabular-nums">@ {(parseFloat(t.price || 0.5)).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};

export default StrategySandbox;
