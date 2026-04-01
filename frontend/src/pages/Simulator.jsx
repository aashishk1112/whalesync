import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { 
  Zap, Shield, Target, Flame, Activity, TrendingUp, TrendingDown, 
  Users, ChevronRight, Check, X, Search, Plus, Info, Rocket, 
  BarChart3, Globe, Award, AlertTriangle, Eye, ArrowRight, Play, Square,
  Settings as SettingsIcon, Layers, Brain
} from 'lucide-react';
import { PortfolioContext } from '../context/PortfolioContext';
import { AuthContext } from '../context/AuthContext';

// --- UTILITIES ---

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const RollingNumber = ({ value, prefix = "", suffix = "", fractionDigits = 0 }) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    const start = displayValue;
    const end = value;
    const duration = 500;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      
      const current = start + (end - start) * easeProgress;
      setDisplayValue(current);
      
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}{suffix}
    </span>
  );
};

const SimulationGraph = ({ results, riskProfile }) => {
  const points = 20;
  const width = 800;
  const height = 200;
  
  const generatePath = (multiplier) => {
    const data = [];
    let current = 0;
    for (let i = 0; i < points; i++) {
        const volatility = riskProfile === 'aggressive' ? 1.5 : riskProfile === 'balanced' ? 1.0 : 0.5;
        const trend = results.pnl7d / points;
        const noise = (Math.random() - 0.5) * 2 * volatility * multiplier;
        current += trend + noise;
        data.push({ x: (i / (points - 1)) * width, y: height/2 - (current / 2) });
    }
    return data;
  };

  const bestLine = useMemo(() => generatePath(1.2), [results, riskProfile]);
  const expectedLine = useMemo(() => generatePath(0.8), [results, riskProfile]);
  const worstLine = useMemo(() => generatePath(1.5), [results, riskProfile]);

  const getPathString = (data) => `M ${data.map(p => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <div className="relative w-full h-[200px] mt-8 bg-black/20 rounded-3xl border border-white/5 overflow-hidden p-4">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grids */}
        {[0, 1, 2, 3].map(i => (
            <line key={i} x1="0" y1={i * height/3} x2={width} y2={i * height/3} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}
        
        {/* Lines */}
        <path d={getPathString(bestLine)} fill="none" stroke="var(--profit)" strokeWidth="2" opacity="0.3" strokeDasharray="4 4" className="transition-all duration-500" />
        <path d={getPathString(worstLine)} fill="none" stroke="var(--risk)" strokeWidth="2" opacity="0.3" strokeDasharray="4 4" className="transition-all duration-500" />
        <path d={getPathString(expectedLine)} fill="none" stroke="var(--primary)" strokeWidth="3" className="transition-all duration-500" />
        
        {/* Glow */}
        <path d={getPathString(expectedLine)} fill="none" stroke="var(--primary)" strokeWidth="6" opacity="0.15" filter="blur(8px)" />
      </svg>
      
      <div className="absolute top-4 right-4 flex flex-col gap-1 text-[8px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-2"><div className="w-2 h-0.5 bg-emerald-400 opacity-60" /> Best Case</div>
        <div className="flex items-center gap-2"><div className="w-2 h-0.5 bg-primary" /> Projected</div>
        <div className="flex items-center gap-2"><div className="w-2 h-0.5 bg-red-400 opacity-60" /> Worst Case</div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const WhaleSyncSimulator = () => {
    const { user } = useContext(AuthContext);
    const { portfolio, settings, strategies, refreshStrategies, refreshPortfolio } = useContext(PortfolioContext);
    
    // Unified State
    const [step, setStep] = useState(1);
    const [newStrat, setNewStrat] = useState({
        name: '',
        type: 'copy-whales', // 'copy-whales', 'win-rate', 'momentum'
        riskProfile: 'balanced',
        capital: 1000,
        selectedWhales: []
    });

    const [results, setResults] = useState({
        pnl7d: 0,
        drawdown: 0,
        confidence: 0,
        diversification: 0
    });

    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Dynamic Recalculation
    useEffect(() => {
        let basePnl = newStrat.capital * (newStrat.riskProfile === 'aggressive' ? 0.18 : newStrat.riskProfile === 'balanced' ? 0.10 : 0.05);
        let whaleMultiplier = 1 + (newStrat.selectedWhales.length * 0.05);
        let baseConfidence = 65 + (newStrat.selectedWhales.length * 5);
        
        // Random noise for realism
        const variance = (Math.random() - 0.5) * 50;
        
        setResults({
            pnl7d: (basePnl * whaleMultiplier) + variance,
            drawdown: newStrat.riskProfile === 'aggressive' ? 12.4 : newStrat.riskProfile === 'balanced' ? 6.2 : 2.8,
            confidence: Math.min(baseConfidence, 98),
            diversification: Math.min(newStrat.selectedWhales.length * 25, 100)
        });
    }, [newStrat]);

    const handleStepSelect = (s) => setStep(s);

    const handleFinalDeploy = async () => {
        if (!newStrat.name) {
            setToast({ type: 'error', message: 'Unit Designation Required' });
            return;
        }
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const payload = {
                name: newStrat.name,
                platform: 'Polymarket',
                allocation_percentage: Math.min((newStrat.capital / portfolio.balance) * 100, 100) || 10,
                bet_size_percentage: newStrat.riskProfile === 'aggressive' ? 18.0 : newStrat.riskProfile === 'balanced' ? 10.0 : 5.0,
                source_addresses: newStrat.selectedWhales,
                risk_mode: newStrat.riskProfile.charAt(0).toUpperCase() + newStrat.riskProfile.slice(1)
            };
            
            const res = await fetch(`${apiUrl}/api/strategies/?user_id=${user.user_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                setToast({ type: 'success', message: '🚀 Strategy Deployed', subtext: 'Simulation live in Alpha Matrix' });
                if (refreshStrategies) await refreshStrategies();
                setTimeout(() => {
                    setStep(1);
                    setNewStrat({ name: '', type: 'copy-whales', riskProfile: 'balanced', capital: 1000, selectedWhales: [] });
                }, 2000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-white p-6 pb-20 overflow-hidden font-inter">
            {/* 🛸 HUD / TOASTS */}
            {toast && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[9999] px-8 py-4 rounded-2xl border backdrop-blur-3xl animate-in slide-in-from-top-4 duration-300 ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-white' : 'bg-primary/10 border-primary/30 text-white'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-primary text-white'}`}>
                            {toast.type === 'error' ? <AlertTriangle size={20} /> : <Rocket size={20} />}
                        </div>
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.2em]">{toast.message}</div>
                            {toast.subtext && <div className="text-[9px] font-bold opacity-60 uppercase tracking-widest">{toast.subtext}</div>}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1800px] mx-auto w-[95%] space-y-8">
                
                {/* 1. 🔥 TOP BOARD — LIVE SIMULATION */}
                <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 mt-4 grid grid-cols-2 lg:grid-cols-4 gap-12 group transition-all hover:bg-slate-900/60 hover:shadow-[0_0_80px_rgba(0,212,255,0.1)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="flex flex-col gap-1 relative z-10 transition-all group-hover:translate-x-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Projected 7D ROI</span>
                        <div className="flex items-end gap-2 text-3xl font-black italic tracking-tighter text-profit">
                            <RollingNumber value={results.pnl7d} prefix="$" fractionDigits={2} />
                            <span className="text-xs font-bold mb-1 opacity-60">+{(results.pnl7d / newStrat.capital * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 relative z-10 group-hover:translate-x-2 transition-all" style={{ transitionDelay: '50ms' }}>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Risk Profile</span>
                        <div className={`text-2xl font-black uppercase italic tracking-tighter ${newStrat.riskProfile === 'aggressive' ? 'text-risk' : newStrat.riskProfile === 'balanced' ? 'text-primary' : 'text-emerald-400'}`}>
                            {newStrat.riskProfile}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 relative z-10 group-hover:translate-x-2 transition-all" style={{ transitionDelay: '100ms' }}>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Max Drawdown</span>
                        <div className="text-2xl font-black text-risk uppercase italic tracking-tighter">
                            -{results.drawdown.toFixed(1)}%
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 relative z-10 group-hover:translate-x-2 transition-all" style={{ transitionDelay: '150ms' }}>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">System Confidence</span>
                        <div className="flex items-center gap-4">
                            <div className="text-2xl font-black text-white italic tracking-tighter">
                                <RollingNumber value={results.confidence} suffix="%" />
                            </div>
                            <div className="flex-1 max-w-[100px] h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(0,212,255,0.8)]" style={{ width: `${results.confidence}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. MAIN 3-ZONE LAYOUT */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    
                    {/* LEFT PANEL — STEP FLOW (4 cols) */}
                    <div className="md:col-span-4 lg:col-span-3 space-y-6">
                        <div className="flex flex-col gap-4">
                            {[
                                { id: 1, label: 'Strategy Type', icon: <Target size={18} />, desc: 'Core execution logic' },
                                { id: 2, label: 'Risk Architecture', icon: <Shield size={18} />, desc: 'Capital protection' },
                                { id: 3, label: 'Capital Matrix', icon: <Target size={18} />, desc: 'Allocation limits' },
                                { id: 4, label: 'Oracle Sync', icon: < Brain size={18} />, desc: 'Connect to whales' },
                                { id: 5, label: 'Review & Ignit', icon: <Rocket size={18} />, desc: 'Final deployment' }
                            ].map((s) => (
                                <div 
                                    key={s.id} 
                                    onClick={() => handleStepSelect(s.id)}
                                    className={`relative group p-5 rounded-3xl border transition-all cursor-pointer ${step === s.id ? 'bg-primary/10 border-primary/40 shadow-[0_0_30px_rgba(0,212,255,0.1)]' : 'bg-slate-900/20 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${step === s.id ? 'bg-primary text-slate-900 shadow-[0_0_20px_rgba(0,212,255,0.5)]' : 'bg-white/5 text-slate-500'}`}>
                                            {step > s.id ? <Check size={20} /> : s.icon}
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white">{s.label}</div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{s.desc}</div>
                                        </div>
                                    </div>
                                    {step === s.id && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-pulse"><ChevronRight size={20} /></div>}
                                </div>
                            ))}
                        </div>

                        {/* SYSTEM HEALTH (replacing static pulse) */}
                        <div className="bg-slate-900/40 p-6 rounded-[32px] border border-white/5 space-y-4">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                                <span>System Integrity</span>
                                <span className="text-profit">Active</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Liquidity Scan</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Whale Pulse</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" style={{ animationDelay: '0.2s' }} />
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black text-primary">
                                    <span>Signal ETA</span>
                                    <span>10s</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL — CONFIG & OUTPUT (8 cols) */}
                    <div className="md:col-span-8 lg:col-span-9 grid grid-cols-1 xl:grid-cols-2 gap-10">
                        
                        {/* CONFIG AREA */}
                        <div className="bg-slate-900/20 backdrop-blur-3xl border border-white/5 rounded-[40px] p-10 min-h-[500px] flex flex-col">
                            
                            <div className="flex-1">
                                {step === 1 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2 mb-10">
                                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Select <span className="text-primary text-glow">Strategy</span></h2>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Core behavioral engine for the Alpha Unit</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-6">
                                            {[
                                                { id: 'copy-whales', label: 'Copy Top Whales', roi: '+18.4%', risk: 'Med', desc: 'Mirror whale movements with Planck-V execution.' },
                                                { id: 'win-rate', label: 'Win Rate Snipers', roi: '+12.1%', risk: 'Low', desc: 'Focus on high-probability accuracy clusters.' },
                                                { id: 'momentum', label: 'Momentum Seekers', roi: '+28.7%', risk: 'High', desc: 'Aggressive front-running of market sentiment spikes.' }
                                            ].map(t => (
                                                <div 
                                                    key={t.id}
                                                    onClick={() => { setNewStrat({...newStrat, type: t.id}); setStep(2); }}
                                                    className={`group p-6 rounded-3xl border-2 transition-all cursor-pointer flex justify-between items-center ${newStrat.type === t.id ? 'border-primary bg-primary/5 shadow-glow' : 'border-white/5 hover:border-white/20'}`}
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${t.risk === 'High' ? 'bg-risk/10 text-risk' : 'bg-primary/10 text-primary'}`}>ROI {t.roi}</div>
                                                            <div className="text-sm font-black uppercase tracking-tight text-white transition-all group-hover:translate-x-1">{t.label}</div>
                                                        </div>
                                                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.desc}</div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"><ChevronRight size={20} /></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2 mb-10">
                                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Risk <span className="text-primary">Profile</span></h2>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Capital protection and leverage matrix</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-6">
                                            {[
                                                { id: 'conservative', label: 'Safety Net', limit: '5%', multiplier: '0.5x', color: 'text-emerald-400' },
                                                { id: 'balanced', label: 'Optimal Growth', limit: '10%', multiplier: '1.0x', color: 'text-primary' },
                                                { id: 'aggressive', label: 'Max Alpha', limit: '18%', multiplier: '1.8x', color: 'text-risk' }
                                            ].map(r => (
                                                <div 
                                                    key={r.id}
                                                    onClick={() => setNewStrat({...newStrat, riskProfile: r.id})}
                                                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex justify-between items-center ${newStrat.riskProfile === r.id ? 'border-primary bg-primary/5 shadow-glow' : 'border-white/5 hover:border-white/10'}`}
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${newStrat.riskProfile === r.id ? 'bg-primary text-slate-900 shadow-glow' : 'bg-white/5 text-slate-500'}`}>
                                                            {r.id === 'aggressive' ? <Flame size={24} /> : r.id === 'balanced' ? <Target size={24} /> : <Shield size={24} />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black uppercase text-white tracking-tight">{r.label}</div>
                                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{r.limit} Util • {r.multiplier} Risk Matrix</div>
                                                        </div>
                                                    </div>
                                                    {newStrat.riskProfile === r.id && <div className="text-primary"><Check size={20} /></div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2 mb-10">
                                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Capital <span className="text-primary">Allocation</span></h2>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Fuel injection for simulation cycles</p>
                                        </div>

                                        <div className="bg-black/20 p-10 rounded-[40px] border border-white/5 space-y-10">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Simulated Balance</div>
                                                    <div className="text-5xl font-black italic tracking-tighter text-white">
                                                        <RollingNumber value={newStrat.capital} prefix="$" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {[500, 1000, 5000].map(p => (
                                                        <button key={p} onClick={() => setNewStrat({...newStrat, capital: p})} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white transition-all uppercase">{p}</button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="relative group">
                                                <input 
                                                    type="range" 
                                                    min="100" 
                                                    max="10000" 
                                                    step="100"
                                                    value={newStrat.capital} 
                                                    onChange={e => setNewStrat({...newStrat, capital: parseInt(e.target.value)})}
                                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary group-hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all" 
                                                />
                                                <div className="flex justify-between mt-4 text-[8px] font-black text-slate-700 uppercase tracking-widest">
                                                    <span>$100 MIN</span>
                                                    <span>MAX $10K</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2 mb-10">
                                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Oracle <span className="text-primary">Selection</span></h2>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Synchronize with top-performing market clusters</p>
                                        </div>

                                        <div className="bg-black/20 rounded-[40px] border border-white/5 overflow-hidden flex flex-col min-h-[400px]">
                                            <div className="p-4 border-b border-white/5 flex gap-4">
                                                <Search size={16} className="text-slate-500" />
                                                <input placeholder="SEARCH ORACLES..." className="bg-transparent border-none p-0 text-[10px] font-black tracking-widest focus:ring-0 w-full uppercase" />
                                            </div>
                                            <div className="flex-1 overflow-y-auto max-h-[350px] custom-scrollbar p-2">
                                                {settings.copy_sources.filter(s => s.active).map(s => (
                                                    <div 
                                                        key={s.address}
                                                        onClick={() => {
                                                            const exists = newStrat.selectedWhales.includes(s.address);
                                                            setNewStrat({
                                                                ...newStrat,
                                                                selectedWhales: exists 
                                                                    ? newStrat.selectedWhales.filter(a => a !== s.address)
                                                                    : [...newStrat.selectedWhales, s.address]
                                                            });
                                                        }}
                                                        className={`flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all hover:bg-white/5 group ${newStrat.selectedWhales.includes(s.address) ? 'bg-primary/5' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                {s.image_url ? <img src={s.image_url} className="w-10 h-10 rounded-2xl border border-white/10" /> : <div className="w-10 h-10 bg-slate-800 rounded-2xl border border-white/10" />}
                                                                {newStrat.selectedWhales.includes(s.address) && <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5"><Check size={10} className="text-slate-900" /></div>}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-black uppercase text-white tracking-tight">{s.name}</div>
                                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{s.address.substring(0,6)}...{s.address.substring(34)}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-black text-profit">+{(Math.random() * 20).toFixed(1)}%</div>
                                                            <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">30D ROI</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center px-4">
                                            <div className="flex -space-x-2">
                                                {newStrat.selectedWhales.map((w,i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[8px] font-black">{i+1}</div>
                                                ))}
                                            </div>
                                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                                                Diversification Score: {results.diversification}%
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 5 && (
                                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="space-y-2 mb-10 text-center">
                                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Final <span className="text-primary">Ignition</span></h2>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Initialize the Alpha Unit across global nodes</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Unit Identification</label>
                                                <input 
                                                    value={newStrat.name}
                                                    onChange={e => setNewStrat({...newStrat, name: e.target.value})}
                                                    placeholder="ALPHA-GHOST-9" 
                                                    className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 text-2xl font-black italic tracking-tighter uppercase focus:border-primary/50 transition-all" 
                                                />
                                            </div>

                                            <div className="bg-primary/5 border border-primary/20 rounded-[40px] p-8 space-y-6">
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div>
                                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Architecture</div>
                                                        <div className="text-sm font-black text-white uppercase">{newStrat.type}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Risk Mode</div>
                                                        <div className={`text-sm font-black uppercase ${newStrat.riskProfile === 'aggressive' ? 'text-red-400' : 'text-primary'}`}>{newStrat.riskProfile}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Capital Fuel</div>
                                                        <div className="text-sm font-black text-white uppercase italic tracking-tighter">${newStrat.capital}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Oracle Cluster</div>
                                                        <div className="text-sm font-black text-white uppercase">{newStrat.selectedWhales.length} Nodes</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={handleFinalDeploy}
                                                disabled={loading}
                                                className="w-full py-6 rounded-[32px] bg-primary text-slate-900 font-black text-sm uppercase tracking-[0.5em] transition-all hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(0,212,255,0.4)] flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {loading ? <Activity className="animate-spin" size={20} /> : <>LAUNCH UNIT 🚀</>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* NAVIGATION BUTTONS */}
                            <div className="mt-auto pt-8 flex gap-4">
                                {step > 1 && (
                                    <button 
                                        onClick={() => setStep(step - 1)}
                                        className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all"
                                    >
                                        Back
                                    </button>
                                )}
                                {step < 5 && (
                                    <button 
                                        onClick={() => setStep(step + 1)}
                                        className="flex-1 py-4 bg-primary text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] transition-all hover:translate-x-1 active:scale-95"
                                    >
                                        Next Phase
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* OUTPUT AREA */}
                        <div className="space-y-10">
                            
                            {/* GRAPH SECTION */}
                            <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[40px] p-10 flex flex-col group transition-all hover:border-primary/20">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black uppercase tracking-tighter italic">Alpha <span className="text-primary">Projection</span></h3>
                                    <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-2xl border border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Sim Time</span>
                                            <span className="text-[10px] font-black text-white">7D CYCLE</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <SimulationGraph results={results} riskProfile={newStrat.riskProfile} />

                                <div className="grid grid-cols-2 gap-8 mt-12">
                                    <div>
                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Expected PnL</div>
                                        <div className="text-3xl font-black italic tracking-tighter text-profit">
                                            <RollingNumber value={results.pnl7d} prefix="+" fractionDigits={2} /> 
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Win Probability</div>
                                        <div className="text-3xl font-black italic tracking-tighter text-white">
                                            <RollingNumber value={results.confidence} suffix="%" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI INSIGHT BOX */}
                            <div className="bg-primary/5 border border-primary/20 rounded-[40px] p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 text-primary"><Brain size={120} /></div>
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="bg-primary/20 p-3 rounded-2xl text-primary animate-pulse">
                                        <Brain size={24} />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Neural Analyzer Insight</div>
                                        <div className="text-xs font-bold text-slate-300 leading-relaxed italic animate-typing">
                                            "This setup performs best in high volatility markets. Current Diversification Score ({results.diversification}%) suggests {results.diversification < 50 ? 'high cluster correlation risk' : 'optimal market exposure'}. Recommend {newStrat.riskProfile === 'aggressive' ? 'scaling in slowly' : 'holding through signal gaps'}."
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PERFORMANCE SCORE */}
                            <div className="bg-slate-900/40 p-8 rounded-[40px] border border-white/5 flex items-center justify-between group hover:border-profit/20 transition-all">
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Risk Adjusted Alpha Score</div>
                                    <div className="text-4xl font-black text-white italic tracking-tighter">
                                        <RollingNumber value={(results.confidence * 0.8) + (results.diversification * 0.2)} fractionDigits={1} />
                                    </div>
                                </div>
                                <div className="w-16 h-16 rounded-full border-4 border-white/5 flex items-center justify-center text-xl font-black italic text-profit transition-all group-hover:scale-110 group-hover:border-profit/40">
                                    A+
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* OPERATIONAL ALPHA UNITS SECTION (Moved to bottom or hidden if requested, keeping it as a list of finished units) */}
                {strategies.length > 0 && (
                    <div className="mt-20 pt-20 border-t border-white/5">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-1.5 h-6 bg-slate-500 rounded-full opacity-40" />
                            <h3 className="text-xl font-black text-slate-500 uppercase tracking-tight italic">Deployed <span className="opacity-60">Alpha Units</span></h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {strategies.map((sm, i) => (
                                <div key={i} className="bg-slate-900/20 border border-white/5 p-6 rounded-[32px] flex flex-col gap-6 opacity-60 hover:opacity-100 transition-all">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm font-black text-white uppercase tracking-tighter italic">{sm.name}</div>
                                        <div className={`w-2 h-2 rounded-full ${sm.status === 'active' ? 'bg-profit animate-pulse' : 'bg-slate-600'}`} />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Balance</div>
                                        <div className="text-sm font-black text-white italic tracking-tighter">
                                            ${parseFloat(sm.simulated_pnl || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                const action = sm.status === 'active' ? 'stop' : 'resume';
                                                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                                                fetch(`${apiUrl}/api/strategies/${sm.strategy_id}/${action}?user_id=${user.user_id}`, { method: 'POST' }).then(() => refreshStrategies());
                                            }}
                                            className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest"
                                        >
                                            {sm.status === 'active' ? 'PAUSE' : 'RESUME'}
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                                                fetch(`${apiUrl}/api/strategies/${sm.strategy_id}?user_id=${user.user_id}`, { method: 'DELETE' }).then(() => refreshStrategies());
                                            }}
                                            className="w-10 h-10 bg-risk/10 text-risk rounded-xl flex items-center justify-center hover:bg-risk hover:text-white transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* CUSTOM STYLES FOR ANIMATIONS */}
            <style jsx>{`
                @keyframes typing {
                    from { width: 0 }
                    to { width: 100% }
                }

                .animate-typing {
                    display: inline-block;
                    overflow: hidden;
                    white-space: nowrap;
                    border-right: 2px solid var(--primary);
                    animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
                }

                @keyframes blink-caret {
                    from, to { border-color: transparent }
                    50% { border-color: var(--primary); }
                }

                input[type='range']::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    background: var(--primary);
                    border: 4px solid var(--bg-darker);
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
                    transition: all 0.2s;
                }

                input[type='range']::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    background: white;
                }

                .shadow-glow {
                    box-shadow: 0 0 40px rgba(0, 212, 255, 0.1);
                }

                .text-glow {
                    text-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
                }
            `}</style>
        </div>
    );
};

export default WhaleSyncSimulator;
