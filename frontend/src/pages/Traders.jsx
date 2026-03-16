import React from 'react';
import { Award, Zap, TrendingUp, ShieldCheck } from 'lucide-react';

const Traders = () => {
    return (
        <div className="container mt-12 animate-fade-in" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '70vh', 
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div className="glass-panel" style={{ 
                padding: '4rem 2rem', 
                maxWidth: '800px', 
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(59, 130, 246, 0.03)',
                border: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                    opacity: 0.1,
                    filter: 'blur(40px)'
                }} />

                <div style={{ marginBottom: '2rem' }}>
                    <span style={{ 
                        background: 'var(--primary)', 
                        color: 'white', 
                        padding: '0.4rem 1.2rem', 
                        borderRadius: '2rem', 
                        fontSize: '0.8rem', 
                        fontWeight: '800',
                        letterSpacing: '1px',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                    }}>
                        COMING SOON
                    </span>
                </div>

                <Award className="text-primary mb-6" size={64} style={{ margin: '0 auto' }} />
                
                <h1 style={{ 
                    fontSize: '3rem', 
                    fontWeight: '900', 
                    marginBottom: '1rem',
                    letterSpacing: '-1.5px',
                    lineHeight: '1.1'
                }}>
                    Trader Behavioral <br />
                    <span className="text-primary">Mirroring Engine</span>
                </h1>

                <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: '1.6' }}>
                    We're building a state-of-the-art execution system that allows you to copy high-performance prediction market participants with zero latency and advanced risk management.
                </p>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '1.5rem', 
                    textAlign: 'left',
                    marginBottom: '3rem'
                }}>
                    <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                        <Zap size={24} className="text-accent mb-3" />
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>1-Click Mirroring</h4>
                        <p className="text-xs text-muted">Instantly replicate trades from top-rated Polymarket wallets.</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                        <TrendingUp size={24} className="text-success mb-3" />
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Performance Stats</h4>
                        <p className="text-xs text-muted">Detailed ROI and accuracy metrics for every linked source.</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                        <ShieldCheck size={24} className="text-primary mb-3" />
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Risk Controls</h4>
                        <p className="text-xs text-muted">Advanced position sizing and stop-loss logic for every copy.</p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <p className="text-sm font-bold uppercase tracking-widest opacity-60">Join the Waitlist</p>
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '400px' }}>
                        <input 
                            type="email" 
                            placeholder="your@email.com" 
                            className="glass-panel"
                            style={{ flex: 1, padding: '0.75rem 1.25rem' }}
                            disabled
                        />
                        <button className="btn-primary" disabled style={{ opacity: 0.6 }}>Notify Me</button>
                    </div>
                    <p className="text-xs text-muted">Launching Q2 2026. Beta access for high-capital nodes only.</p>
                </div>
            </div>
        </div>
    );
};

export default Traders;
