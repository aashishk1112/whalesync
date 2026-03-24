import React, { useState, useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Shield, Sparkles, Activity, Lock, Globe, Cpu } from 'lucide-react';

import AlphaTicker from '../components/AlphaTicker';

const Login = () => {
    const [error, setError] = useState('');
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        const params = new URLSearchParams(location.search);
        const ref = params.get('ref');
        const result = await login(credentialResponse.credential, ref);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'Google login failed.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col relative">
            {/* Animated Mesh Background (Blue-Cyan) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[120px] rounded-full animate-mesh-1" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[150px] rounded-full animate-mesh-2" />
                <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-indigo-500/5 blur-[100px] rounded-full animate-mesh-3" />
                
                {/* CSS Grain/Noise Overlay */}
                <div className="absolute inset-0 opacity-[0.03] contrast-150 brightness-100 mix-blend-overlay" 
                     style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                </div>
            </div>

            {/* TOP: Live Ticker */}
            <header className="relative z-50">
                <AlphaTicker variant="mini" />
            </header>
            
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                <div className="max-w-5xl w-full flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    
                    {/* CENTER: Hero Title */}
                    <div className="mb-12 space-y-2">
                        <h1 className="text-5xl md:text-[100px] font-black text-white italic tracking-tighter leading-[0.85] uppercase">
                            Scale<br />
                            <span className="text-primary italic-none">Alpha</span> <span className="text-white/10 italic-none">Vector</span>
                        </h1>
                        <p className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-80">
                            Neural-Link Execution for Prediction Markets
                        </p>
                    </div>

                    {/* STATS STRIP: Above Card */}
                    <div className="flex items-center gap-12 mb-10 px-8 py-3 bg-white/[0.02] border border-white/5 rounded-full backdrop-blur-md">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-white">$142M+</span>
                            <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Volume</span>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-white">4.8k</span>
                            <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Traders</span>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-white italic">0.4ms</span>
                            <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Latency</span>
                        </div>
                    </div>

                    {/* MAIN CARD: Glassmorphic with Hover Glow */}
                    <div className="relative group w-full max-w-sm">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-[42px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <div className="relative bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden text-center flex flex-col items-center">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 border border-primary/20">
                                <Shield size={28} />
                            </div>

                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Link Active</span>
                            </div>

                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">
                                {user ? `Welcome back, ${user.username.split(' ')[0]}` : 'Terminal Access'}
                            </h2>
                            
                            {/* Live Signal Indicator */}
                            <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest mb-10 animate-pulse">
                                <Zap size={12} />
                                +12.4% ROI opportunity detected
                            </div>
                            
                            {error && (
                                <div className="w-full mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                    <Activity size={14} className="text-red-500" />
                                    <span className="text-red-500 text-[10px] font-bold uppercase tracking-wide text-left">{error}</span>
                                </div>
                            )}

                            <div className="w-full">
                                {user ? (
                                    <button 
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                                    >
                                        Enter Terminal
                                    </button>
                                ) : (
                                    <div className="flex justify-center">
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={() => setError('Login Failed')}
                                            theme="filled_black"
                                            shape="pill"
                                            text="continue_with"
                                            size="large"
                                            width="100%"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Social Proof */}
                            <div className="mt-8 pt-8 border-t border-white/5 w-full">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <span className="text-white">124</span> traders entered in last 60s
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM: Trust Bullets */}
                    <div className="mt-16 grid grid-cols-3 gap-6 w-full max-w-2xl">
                        {[
                            { icon: <Users size={14} />, text: "Copy top 1% traders" },
                            { icon: <Cpu size={14} />, text: "AI-powered signals" },
                            { icon: <Globe size={14} />, text: "Risk-adjusted leaderboard" }
                        ].map((bullet, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 text-slate-500 opacity-60 hover:opacity-100 transition-opacity">
                                <div className="text-primary">{bullet.icon}</div>
                                <span className="text-[9px] font-black uppercase tracking-widest">{bullet.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Subdued Aesthetic Footer */}
            <footer className="p-8 flex justify-between items-center relative z-10 border-t border-white/5">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">WhaleSync © 2026 • Core Protocol 4.2</span>
                <div className="flex gap-8">
                    <a href="/terms" className="text-[8px] font-black text-slate-600 uppercase tracking-widest no-underline hover:text-primary transition-colors">Neural Terms</a>
                    <a href="/privacy" className="text-[8px] font-black text-slate-600 uppercase tracking-widest no-underline hover:text-primary transition-colors">Privacy Disclosure</a>
                </div>
            </footer>
        </div>
    );
};

export default Login;
