import React, { useContext, useState } from 'react';
import { PortfolioContext } from '../context/PortfolioContext';
import { 
    TrendingUp, 
    Target, 
    ShieldAlert, 
    BarChart3, 
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Activity
} from 'lucide-react';

const PerformanceDashboard = () => {
    const { portfolio } = useContext(PortfolioContext);
    const [timeRange, setTimeRange] = useState('7D');

    const stats = {
        totalPnl: portfolio.total_pnl || 0,
        roi: portfolio.roi || 0,
        accuracy: portfolio.accuracy || 0,
        riskScore: portfolio.risk_score || 0,
        unrealizedPnl: portfolio.total_unrealized_pnl || 0,
        totalResolved: portfolio.total_resolved || 0,
        balance: portfolio.balance || 10000
    };

    return (
        <div className="pt-12 pb-20 animate-fade-in">
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
                        <span>OCT 12</span>
                        <span>OCT 18</span>
                        <span>NOV 04</span>
                        <span>NOV 24</span>
                        <span>DEC 12</span>
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
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Your performance is in the <span className="text-emerald-400 font-black">TOP 15%</span> of all active Whalesync alpha stimulators.</p>
                    </div>

                    <div className="bg-slate-900/20 backdrop-blur-xl p-8 rounded-[32px] border border-slate-800/50 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-10">
                            <Calendar size={18} className="text-primary" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Strategy Efficiency</h4>
                        </div>
                        <div className="flex flex-col gap-8 flex-1 justify-center">
                            <EfficiencyItem label="Manual Execution" value="84%" color="primary" />
                            <EfficiencyItem label="Automated Whale Mirror" value="62%" color="purple-400" />
                            <EfficiencyItem label="AI Consensus Signal" value="91%" color="emerald-400" />
                        </div>
                    </div>
                </div>
            </div>
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
