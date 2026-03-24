import React, { useState, useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Shield, Sparkles, Activity, Lock, Globe, Cpu } from 'lucide-react';

import AlphaTicker from '../components/AlphaTicker';

const Login = () => {
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        const params = new URLSearchParams(location.search);
        const ref = params.get('ref');
        const result = await login(credentialResponse.credential, ref);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || 'Google login failed.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col relative">
            {/* Immersive Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/15 blur-[180px] rounded-full animate-pulse-delayed" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
                
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />
            </div>

            <AlphaTicker variant="mini" />
            
            <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
                <div className="max-w-4xl w-full flex flex-col items-center text-center">
                    {/* Stealth Entry Indicator */}
                    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-12 animate-fade-in shadow-2xl backdrop-blur-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Terminal • Secure Gate 0-1</span>
                    </div>

                    {/* Typography Redesign */}
                    <div className="mb-16 space-y-4">
                        <h1 className="text-6xl md:text-[110px] font-black text-white italic tracking-tighter leading-[0.85] uppercase">
                            <span className="relative inline-block">
                                Scale
                                <Sparkles className="absolute -top-6 -right-8 text-primary/40 animate-pulse" size={40} />
                            </span><br />
                            <span className="text-primary italic-none">Alpha</span> <span className="text-white/20">Vector</span>
                        </h1>
                        <p className="max-w-lg mx-auto text-slate-500 text-sm md:text-base font-bold uppercase tracking-[0.2em] leading-relaxed opacity-60">
                            Neural-Link Execution for Prediction Markets.
                        </p>
                    </div>

                    {/* Entry Card Redesign */}
                    <div className="relative group w-full max-w-sm">
                        {/* Glow effect behind card */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[42px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <div className="relative bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
                            {/* Inner gradient line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                            
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 border border-primary/20 shadow-inner">
                                    <Shield size={32} />
                                </div>

                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Initialize Link</h2>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10">Verification Protocol Required</p>
                                
                                {error && (
                                    <div className="w-full mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                        <Activity size={14} className="text-red-500" />
                                        <span className="text-red-500 text-[10px] font-bold uppercase tracking-wide text-left">{error}</span>
                                    </div>
                                )}

                                <div className="w-full flex justify-center py-2 relative">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => setError('Login Failed')}
                                        theme="filled_black"
                                        shape="pill"
                                        text="continue_with"
                                        size="large"
                                        width="100%"
                                    />
                                    {/* Subpixel effect for premium feel */}
                                    <div className="absolute inset-0 pointer-events-none bg-primary/5 rounded-full blur-sm -z-10" />
                                </div>

                                <div className="mt-10 flex flex-col gap-4 w-full">
                                    <div className="flex items-center gap-4 text-slate-600">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.3em]">Encryption Status</span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { icon: <Lock size={12} />, label: "SSL" },
                                            { icon: <Cpu size={12} />, label: "AES" },
                                            { icon: <Globe size={12} />, label: "W3" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex flex-col items-center gap-1 p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                                                <div className="text-slate-400 group-hover:text-primary transition-colors">{item.icon}</div>
                                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Footer (Subtle) */}
                    <div className="mt-20 flex items-center justify-center gap-12 border-t border-white/5 pt-12 w-full max-w-2xl opacity-40">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xl font-black text-white">$142M+</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Aggregate Vol</span>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xl font-black text-white">4.8k+</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Institutional Nodes</span>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xl font-black text-white">0.4ms</span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Execution Latency</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Aesthetic Footer */}
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
