import React, { useContext, useState } from 'react';
import { PortfolioContext } from '../context/PortfolioContext';
import { AuthContext } from '../context/AuthContext';
import { 
    TrendingUp, 
    Target, 
    ShieldAlert, 
    BarChart3, 
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Activity,
    Zap,
    X,
    Shield
} from 'lucide-react';

const PerformanceDashboard = () => {
    const { user } = useContext(AuthContext);
    const { portfolio, strategies } = useContext(PortfolioContext);
    const [timeRange, setTimeRange] = useState('7D');
    const [tradesModal, setTradesModal] = useState(null);

    const stats = {
        totalPnl: portfolio.total_pnl || 0,
        roi: portfolio.roi || 0,
        accuracy: portfolio.accuracy || 0,
        riskScore: portfolio.risk_score || 0,
        unrealizedPnl: portfolio.total_unrealized_pnl || 0,
        totalResolved: portfolio.total_resolved || 0,
        balance: portfolio.balance || 10000
    };

    const viewTrades = async (strategy) => {
        setTradesModal({ stratId: strategy.strategy_id, name: strategy.name, loading: true, trades: [] });
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/strategies/${strategy.strategy_id}/trades?user_id=${user?.user_id||user?.userId}`);
            let fetchedTrades = [];
            if (res.ok) {
                const data = await res.json();
                fetchedTrades = data.trades || [];
            }
            
            // Enforce live data only, strip all static placeholders
            setTradesModal({ stratId: strategy.strategy_id, name: strategy.name, loading: false, trades: fetchedTrades });
        } catch(err) {
            setTradesModal({ stratId: strategy.strategy_id, name: strategy.name, loading: false, trades: [] });
        }
    };

    return (
        <div className="pt-12 pb-20 animate-fade-in relative block h-full min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-slate-800/50 pb-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black mb-2 uppercase tracking-tighter text-white">
                        Performance <span className="text-primary">Intelligence</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">Deep analysis of your prediction market simulations</p>
                </div>
                
                <div className="flex bg-slate-900/40 backdrop-blur-md p-1 rounded-xl border border-slate-800/50">
                    {['24H', '7D', '30D', 'ALL'].map(range => (
                        <button 
                            key={range}
                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                timeRange === range ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'
                            }`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <MetricCard 
                    title="Total Return" 
                    value={`$${stats.totalPnl.toLocaleString()}`} 
                    subValue={`${stats.roi >= 0 ? '+' : ''}${stats.roi}% ROI`}
                    icon={<TrendingUp size={20} />} 
                    trend={stats.roi >= 0}
                    color="primary"
                />
                <MetricCard 
                    title="Prediction Accuracy" 
                    value={`${stats.accuracy}%`} 
                    subValue={`${stats.wins || 0} wins out of ${stats.totalResolved}`}
                    icon={<Target size={20} />} 
                    trend={stats.accuracy >= 60}
                    color="emerald-400"
                />
                <MetricCard 
                    title="Risk Quotient" 
                    value={stats.riskScore} 
                    subValue="Low Exposure"
                    icon={<ShieldAlert size={20} />} 
                    trend={stats.riskScore < 4}
                    color="purple-400"
                />
                 <MetricCard 
                    title="Active Equity" 
                    value={`$${stats.balance.toLocaleString()}`} 
                    subValue={`+$${stats.unrealizedPnl} unrealized`}
                    icon={<BarChart3 size={20} />} 
                    trend={true}
                    color="slate-200"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
                {/* Equity Growth Command Center */}
                <div className="bg-slate-900/20 backdrop-blur-xl p-8 rounded-[32px] border border-slate-800/50">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <Activity size={20} className="text-primary animate-pulse" />
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Equity Growth Curve</h3>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Realized</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Benchmark</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full relative group">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 800 300" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Grid Lines */}
                            {[0, 1, 2, 3].map(i => (
                                <line 
                                    key={i} 
                                    x1="0" y1={i * 100} x2="800" y2={i * 100} 
                                    stroke="rgba(255,255,255,0.03)" 
                                    strokeWidth="1" 
                                />
                            ))}
                            {/* Area */}
                            <path 
                                d="M0,300 L0,220 C100,210 200,250 300,180 C400,110 500,150 600,80 C700,10 750,30 800,50 L800,300 Z" 
                                fill="url(#curveGradient)" 
                                className="transition-all duration-700 ease-out"
                            />
                            {/* Main Line */}
                            <path 
                                d="M0,220 C100,210 200,250 300,180 C400,110 500,150 600,80 C700,10 750,30 800,50" 
                                fill="none" 
                                stroke="#22d3ee" 
                                strokeWidth="3" 
                                strokeLinecap="round"
                                className="drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                            />
                            {/* Dynamic Markers */}
                            <circle cx="300" cy="180" r="4" fill="#22d3ee" className="animate-pulse" />
                            <circle cx="600" cy="80" r="4" fill="#22d3ee" className="animate-pulse" />
                            <g className="filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                                <circle cx="800" cy="50" r="6" fill="#22d3ee" stroke="white" strokeWidth="2" />
                            </g>
                        </svg>
                    </div>
                    
                    <div className="flex justify-between mt-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 px-2">
                        <span>LIVE TICKER</span>
                        <span className="text-primary italic">TODAY</span>
                    </div>
                </div>

                {/* Performance Analytics Sidebar */}
                <div className="flex flex-col gap-8">
                    <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[32px] border border-slate-800/50 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
                        <div className="flex items-center gap-3 mb-6">
                            <CheckCircle2 size={18} className="text-emerald-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Reliability Score</h4>
                        </div>
                        <div className="relative h-2 bg-slate-950 rounded-full overflow-hidden mb-6 shadow-inner">
                             <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.3)] transition-all duration-1000"
                                style={{ width: `${stats.accuracy}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Your performance indicates an accuracy curve tracking closely to live market settlement events.</p>
                    </div>

                    <div className="bg-slate-900/20 backdrop-blur-xl p-8 rounded-[32px] border border-slate-800/50 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-10">
                            <Calendar size={18} className="text-primary" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Live Strategy Efficiency</h4>
                        </div>
                        <div className="flex flex-col gap-8 flex-1 justify-center">
                            <EfficiencyItem label="Systematic Win Rate" value={`${stats.accuracy}%`} color="primary" />
                            <EfficiencyItem label="Market Edge" value={`${Math.min(99, stats.accuracy * 1.2).toFixed(1)}%`} color="purple-400" />
                            <EfficiencyItem label="AI Consensus Correlation" value={`${Math.min(99, stats.accuracy * 1.1).toFixed(1)}%`} color="emerald-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Strategy Units List */}
            {strategies && strategies.length > 0 && (
                 <div className="mt-12 bg-slate-900/20 backdrop-blur-xl p-8 rounded-[32px] border border-slate-800/50">
                     <div className="flex items-center gap-3 mb-8">
                        <Zap size={20} className="text-primary animate-pulse" />
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Active Strategy Engines</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {strategies.map((s, idx) => (
                             <div key={idx} onClick={() => viewTrades(s)} className="bg-slate-950/50 border border-white/5 p-6 rounded-2xl cursor-pointer hover:border-primary/40 transition-all group shadow-lg shadow-black/50">
                                 <div className="flex justify-between items-center mb-4">
                                     <div className="font-black text-white italic truncate max-w-[180px] uppercase tracking-tighter">{s.name}</div>
                                     <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800/50 text-slate-500 border border-white/5'}`}>{s.status || 'inactive'}</div>
                                 </div>
                                 <div className="flex justify-between items-end">
                                     <div>
                                         <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Simulated Return</div>
                                         <div className={`text-lg font-black tabular-nums transition-all ${parseFloat(s.simulated_pnl || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                             ${parseFloat(s.simulated_pnl || 0).toFixed(2)}
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Exposure</div>
                                         <div className="text-sm font-black text-white">{s.allocation_percentage}%</div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

            {/* Trades Modal Layer */}
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
                                    <div key={i} className="p-4 bg-slate-950/50 border border-white/5 rounded-2xl flex items-center justify-between">
                                        <div className="flex gap-4 items-center">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${t.position === 'YES' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {t.position}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-white tracking-widest mb-1 truncate max-w-[200px]">{t.market_id || 'Polymarket Event'}</div>
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.category || 'General'} • {new Date(t.timestamp).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-white tabular-nums">${parseFloat(t.amount || 0).toFixed(2)}</div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">@ ${(t.price || 0.5).toFixed(2)}</div>
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

const MetricCard = ({ title, value, subValue, icon, trend, color }) => (
    <div className={`bg-slate-900/40 backdrop-blur-xl p-8 rounded-[32px] border border-slate-800/50 relative group hover:border-${color}/30 transition-all overflow-hidden`}>
        <div className={`absolute top-0 left-0 w-1 h-full bg-${color}/40`}></div>
        <div className="flex justify-between items-start mb-6">
            <div className={`text-${color} p-3 bg-${color}/5 rounded-2xl border border-${color}/10 group-hover:scale-110 transition-transform`}>{icon}</div>
            <div className={`${trend ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border-rose-400/20'} px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border`}>
                {trend ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {trend ? 'Stable' : 'Volatile'}
            </div>
        </div>
        <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</h4>
        <p className="text-3xl font-black text-white tracking-tighter mb-1">{value}</p>
        <p className="text-xs font-bold text-slate-400/60 uppercase tracking-widest">{subValue}</p>
    </div>
);

const EfficiencyItem = ({ label, value, color }) => (
    <div className="group">
        <div className="flex justify-between items-end mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">{label}</span>
            <span className={`text-xs font-black text-${color} tracking-tighter`}>{value}</span>
        </div>
        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden shadow-inner">
            <div 
                className={`h-full bg-${color} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: value }}
            ></div>
        </div>
    </div>
);

export default PerformanceDashboard;
