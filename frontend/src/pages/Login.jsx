import React, { useState, useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Brain, Target, Globe, Zap } from 'lucide-react';

const Login = () => {
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        const result = await login(credentialResponse.credential);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || 'Google login failed.');
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Landing Page Sections */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <section className="container" style={{ textAlign: 'center', paddingTop: '5rem', paddingBottom: '5rem', position: 'relative', zIndex: 5 }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '2rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '2rem' }}>
                            <Zap size={14} /> The Future of Prediction Markets
                        </div>
                        
                        <h2 className="text-gradient" style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', lineHeight: 1.1, margin: '0 0 1.5rem 0', fontWeight: 800, letterSpacing: '-1px' }}>
                            Trade like the top <span className="text-gradient-primary">1%</span>.<br />Automatically.
                        </h2>
                        
                        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', margin: '0 auto 3rem auto', lineHeight: 1.6, maxWidth: '600px' }}>
                            Analyze behavioral genomes of profitable traders, copy their strategies risk-free via our simulator, and execute live on Polymarket.
                        </p>

                        <div className="glass-panel hover-glow animate-float" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 3rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Start your journey</h3>
                            
                            {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.75rem 1.5rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

                            <div style={{ transform: 'scale(1.1)' }}>
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Login Failed')}
                                    theme="filled_black"
                                    shape="pill"
                                    text="continue_with"
                                />
                            </div>
                            <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '1.5rem', opacity: 0.7 }}>
                                By signing securely with Google, you agree to our <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Terms</a>.
                            </span>
                        </div>
                    </div>

                    {/* Background Decorative Blobs */}
                    <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.15, zIndex: -1, borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.1, zIndex: -1, borderRadius: '50%' }} />
                </section>

                <section className="container" style={{ paddingBottom: '6rem', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        
                        <div className="glass-panel hover-glow animate-float" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <Brain size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0 0 0' }}>Behavioral Genomes</h3>
                            <p className="text-muted" style={{ margin: 0, lineHeight: 1.6 }}>We analyze millions of on-chain data points to build psychological maps of top Polymarket earners. Discover their risk tolerance, favorite platforms, and strike rates before copying.</p>
                        </div>

                        <div className="glass-panel hover-glow animate-float-delayed" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                <Target size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0 0 0' }}>Paper Simulator</h3>
                            <p className="text-muted" style={{ margin: 0, lineHeight: 1.6 }}>Deploy virtual capital ($10K starting portfolio) into our time-series simulation system. Backtest trader strategies and see exactly how much you would have earned in the real market.</p>
                        </div>

                        <div className="glass-panel hover-glow animate-float" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                                <Globe size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0 0 0' }}>1-Click Automation</h3>
                            <p className="text-muted" style={{ margin: 0, lineHeight: 1.6 }}>Confidently link your Web3 wallet. Our market interaction system interfaces directly with Polymarket&apos;s CLOB API using Layer 2 signatures to interact with markets directly from your Proxy wallet.</p>
                        </div>

                    </div>
                </section>
            </main>
        </div>
    );
};

export default Login;
