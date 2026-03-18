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
    CheckCircle2
} from 'lucide-react';

const PerformanceDashboard = () => {
    const { portfolio } = useContext(PortfolioContext);
    const [timeRange, setTimeRange] = useState('7D');

    // Use default values if metrics are missing
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
        <div className="container mt-12 animate-fade-in" style={{ paddingBottom: '5rem' }}>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                        Performance <span className="text-primary">Intelligence</span>
                    </h1>
                    <p className="text-muted">Deep analysis of your prediction market simulation performance.</p>
                </div>
                
                <div className="flex glass-panel p-1" style={{ borderRadius: '1rem' }}>
                    {['24H', '7D', '30D', 'ALL'].map(range => (
                        <button 
                            key={range}
                            className={timeRange === range ? 'btn-primary' : 'btn-ghost'}
                            style={{ 
                                padding: '0.4rem 1.2rem', 
                                fontSize: '0.75rem',
                                borderRadius: '0.8rem',
                                background: timeRange === range ? 'var(--primary)' : 'transparent',
                                border: 'none'
                            }}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <MetricCard 
                    title="Total Return" 
                    value={`$${stats.totalPnl.toLocaleString()}`} 
                    subValue={`${stats.roi >= 0 ? '+' : ''}${stats.roi}% ROI`}
                    icon={<TrendingUp size={20} />} 
                    trend={stats.roi >= 0}
                    color="var(--primary)"
                />
                <MetricCard 
                    title="Prediction Accuracy" 
                    value={`${stats.accuracy}%`} 
                    subValue={`${stats.wins || 0} wins out of ${stats.totalResolved}`}
                    icon={<Target size={20} />} 
                    trend={stats.accuracy >= 60}
                    color="var(--success)"
                />
                <MetricCard 
                    title="Risk Quotient" 
                    value={stats.riskScore} 
                    subValue="Low Exposure"
                    icon={<ShieldAlert size={20} />} 
                    trend={stats.riskScore < 4}
                    color="var(--accent)"
                />
                 <MetricCard 
                    title="Active Equity" 
                    value={`$${stats.balance.toLocaleString()}`} 
                    subValue={`+$${stats.unrealizedPnl} unrealized`}
                    icon={<BarChart3 size={20} />} 
                    trend={true}
                    color="var(--text-main)"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* P&L Curve Placeholder - Using a CSS/SVG approximation for WOW factor */}
                <div className="lg:col-span-2 glass-panel" style={{ padding: '2rem' }}>
                    <div className="flex justify-between items-center mb-8">
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Equity Growth Curve</h3>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1"><div style={{width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%'}}></div> Realized</div>
                          <div className="flex items-center gap-1"><div style={{width: 8, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: '50%'}}></div> Benchmark</div>
                        </div>
                    </div>
                    
                    <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                        <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Grid Lines */}
                            {[0, 1, 2, 3].map(i => (
                                <line key={i} x1="0" y1={i * 100} x2="800" y2={i * 100} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                            ))}
                            {/* Area */}
                            <path 
                                d="M0,300 L0,220 C100,210 200,250 300,180 C400,110 500,150 600,80 C700,10 800,50 L800,300 Z" 
                                fill="url(#curveGradient)" 
                            />
                            {/* Line */}
                            <path 
                                d="M0,220 C100,210 200,250 300,180 C400,110 500,150 600,80 C700,10 800,50" 
                                fill="none" 
                                stroke="var(--primary)" 
                                strokeWidth="3" 
                                strokeLinecap="round"
                            />
                            {/* Dots */}
                            <circle cx="300" cy="180" r="4" fill="var(--primary)" />
                            <circle cx="600" cy="80" r="4" fill="var(--primary)" />
                            <circle cx="800" cy="50" r="6" fill="var(--primary)" stroke="white" strokeWidth="2" />
                        </svg>
                    </div>
                    
                    <div className="flex justify-between mt-4 text-xs text-muted px-2">
                        <span>OCT 12</span>
                        <span>OCT 18</span>
                        <span>NOV 04</span>
                        <span>NOV 24</span>
                        <span>DEC 12</span>
                        <span>TODAY</span>
                    </div>
                </div>

                {/* Risk Distribution & Metrics */}
                <div className="flex flex-col gap-6">
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 className="mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-success" /> Reliability Score</h4>
                        <div style={{ position: 'relative', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
                             <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${stats.accuracy}%`, background: 'var(--success)', borderRadius: '6px' }}></div>
                        </div>
                        <p className="text-xs text-muted">Your performance is in the top 15% of all WhaleSync stimulators.</p>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
                        <h4 className="mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary" /> Strategy Efficiency</h4>
                        <div className="flex flex-col gap-4">
                            <EfficiencyItem label="Manual Execution" value="84%" color="var(--primary)" />
                            <EfficiencyItem label="Automated Whale Mirror" value="62%" color="var(--accent)" />
                            <EfficiencyItem label="AI Consensus Signal" value="91%" color="var(--success)" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, subValue, icon, trend, color }) => (
    <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${color}` }}>
        <div className="flex justify-between items-start mb-4">
            <div style={{ color }}>{icon}</div>
            <div className={trend ? 'text-success' : 'text-danger'} style={{ fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                {trend ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {trend ? 'Stable' : 'Volatile'}
            </div>
        </div>
        <h4 className="text-muted text-xs uppercase font-bold tracking-wider mb-1">{title}</h4>
        <p style={{ fontSize: '1.75rem', fontWeight: '900', margin: 0 }}>{value}</p>
        <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>{subValue}</p>
    </div>
);

const EfficiencyItem = ({ label, value, color }) => (
    <div>
        <div className="flex justify-between text-xs mb-1">
            <span>{label}</span>
            <span style={{ color, fontWeight: 'bold' }}>{value}</span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: value, background: color }}></div>
        </div>
    </div>
);

export default PerformanceDashboard;
