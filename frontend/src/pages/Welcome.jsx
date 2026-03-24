import React, { useState, useContext, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Zap, Shield, Sparkles, Activity, Lock, Globe, Cpu, Users, ChevronRight } from 'lucide-react';

import AlphaTicker from '../components/AlphaTicker';

const Welcome = () => {
    const [error, setError] = useState('');
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Animate stats numbers if needed
    const [volume, setVolume] = useState(140);
    useEffect(() => {
        const interval = setInterval(() => {
            setVolume(v => v + Math.random() * 0.1);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        const params = new URLSearchParams(location.search);
        const ref = params.get('ref');
        const result = await login(credentialResponse.credential, ref);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'Identity Verification Failed.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col relative font-sans">
            {/* CSS Mesh Animation Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes mesh-1 {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(10%, 10%) scale(1.1); }
                    66% { transform: translate(-5%, 15%) scale(0.9); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                @keyframes mesh-2 {
                    0% { transform: translate(0, 0) scale(1.2); }
                    33% { transform: translate(-15%, -5%) scale(1); }
                    66% { transform: translate(10%, -10%) scale(1.1); }
                    100% { transform: translate(0, 0) scale(1.2); }
                }
                @keyframes mesh-3 {
                    0% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(5%, -15%) scale(1.2); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                .animate-mesh-1 { animation: mesh-1 20s infinite ease-in-out; }
                .animate-mesh-2 { animation: mesh-2 25s infinite ease-in-out; }
                .animate-mesh-3 { animation: mesh-3 18s infinite ease-in-out; }
                
                .glass-card {
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .hover-glow:hover {
                    border-color: rgba(6, 182, 212, 0.3);
                    box-shadow: 0 0 40px rgba(6, 182, 212, 0.15);
                }
            `}} />

            {/* TOP: Live Ticker */}
            <header className="relative z-50">
                <AlphaTicker variant="mini" />
            </header>

            {/* Background Mesh (Blue-Cyan) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[120px] rounded-full animate-mesh-1" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full animate-mesh-2" />
                <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-indigo-500/5 blur-[100px] rounded-full animate-mesh-3" />
                
                {/* Noise Texturing */}
                <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" 
                     style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                </div>
            </div>
            
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                <div className="max-w-5xl w-full flex flex-col items-center text-center">
                    
                    {/* CENTER: Hero Title */}
                    <div className="mb-14 animate-in fade-in duration-1000">
                        <h1 className="text-6xl md:text-[110px] font-black text-white italic tracking-tighter leading-[0.8] uppercase flex flex-col items-center">
                            <span>Scale</span>
                            <div className="flex items-center gap-4">
                                <span className="text-cyan-400 italic-none">Alpha</span>
                                <span className="text-white/10 italic-none">Vector</span>
                            </div>
                        </h1>
                        <p className="mt-6 text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.5em] opacity-60">
                            Neural-Link Execution for Prediction Markets
                        </p>
                    </div>

                    {/* STATS STRIP: Above Card */}
                    <div className="flex items-center gap-12 mb-10 px-10 py-4 glass-card rounded-full animate-in fade-in slide-in-from-bottom-4 duration-1200 delay-200">
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-white">${volume.toFixed(1)}M+</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Aggregate Vol</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-white">4.8k+</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Traders</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-white italic">0.4ms</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Execution Lag</span>
                        </div>
                    </div>

                    {/* MAIN CARD: Glassmorphic with Animation */}
                    <div className="relative group w-full max-w-sm animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                        {/* Dynamic Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-[44px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <div className="relative glass-card hover-glow rounded-[40px] p-10 overflow-hidden text-center flex flex-col items-center transition-all duration-500">
                            {/* Inner Accent Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                            
                            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-8 border border-cyan-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <Shield size={32} />
                            </div>

                            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Link Active</span>
                            </div>

                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                                {user ? `Welcome back, ${user.username.split(' ')[0]}` : 'Terminal Node Access'}
                            </h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10 opacity-70">
                                {user ? 'Neural verification complete' : 'Secure Verification Protocol Required'}
                            </p>
                            
                            {/* Personalized Opportunity Signal */}
                            <div className="w-full py-3 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex items-center justify-center gap-3 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-10 group-hover:border-cyan-500/20 transition-all">
                                <Zap size={14} className="animate-pulse" />
                                +12.4% ROI opportunity detected
                            </div>
                            
                            {error && (
                                <div className="w-full mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                    <Activity size={14} className="text-red-500" />
                                    <span className="text-red-500 text-[10px] font-bold uppercase tracking-wide text-left">{error}</span>
                                </div>
                            )}

                            <div className="w-full flex justify-center py-2 relative">
                                {user ? (
                                    <button 
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.25em] rounded-2xl hover:bg-primary-hover shadow-[0_15px_30px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-3"
                                    >
                                        Enter Terminal <ChevronRight size={14} />
                                    </button>
                                ) : (
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('Login Failed')}
                                        theme="filled_black"
                                        shape="pill"
                                        text="continue_with"
                                        size="large"
                                        width="100%"
                                    />
                                )}
                            </div>

                            {/* Social Proof Section */}
                            <div className="mt-10 pt-10 border-t border-white/5 w-full flex flex-col items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-500">
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-cyan-500 flex items-center justify-center text-[7px] font-black text-white">
                                        +120
                                    </div>
                                </div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.25em]">
                                    <span className="text-white">124</span> traders entered in last 60s
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM: Trust Bullets (Microcopy) */}
                    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-3xl animate-in fade-in duration-2000 delay-500">
                        {[
                            { icon: <Users size={16} />, title: "Copy top 1% traders", desc: "Mirror real-time strategy vectors" },
                            { icon: <Cpu size={16} />, title: "AI-powered signals", desc: "Neural trend filtration engine" },
                            { icon: <Globe size={16} />, title: "Risk leaderboard", desc: "Adjusted performance metrics" }
                        ].map((bullet, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 text-center group cursor-default">
                                <div className="text-cyan-500 group-hover:scale-125 transition-transform duration-500 p-3 bg-cyan-500/5 rounded-full border border-cyan-500/10 shadow-lg">
                                    {bullet.icon}
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[10px] font-black text-white uppercase tracking-widest">{bullet.title}</span>
                                    <span className="block text-[8px] font-black text-slate-600 uppercase tracking-tighter">{bullet.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Premium Aesthetic Footer */}
            <footer className="p-10 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 border-t border-white/5 bg-slate-950/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">WhaleSync © 2026 Core Protocol 4.2</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                </div>
                <div className="flex gap-12">
                    <Link to="/terms" className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] no-underline hover:text-cyan-400 transition-colors cursor-pointer">Neural Terms</Link>
                    <Link to="/privacy" className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] no-underline hover:text-cyan-400 transition-colors cursor-pointer">Privacy Policy</Link>
                    <Link to="/docs" className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] no-underline hover:text-cyan-400 transition-colors cursor-pointer">Documentation</Link>
                </div>
            </footer>
        </div>
    );
};

export default Welcome;
