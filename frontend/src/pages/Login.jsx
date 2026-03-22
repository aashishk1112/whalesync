import React, { useState, useContext, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Brain, Target, Globe, Zap, Clock, Sparkles, Shield, TrendingUp, BarChart3, Users } from 'lucide-react';

import AlphaTicker from '../components/AlphaTicker';

const LeaderboardPreview = () => {
    const [traders, setTraders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopTraders = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/traders/leaderboard?timeframe=WEEK&sort_by=SCORE`);
                if (res.ok) {
                    const data = await res.json();
                    setTraders((data.traders || []).slice(0, 5));
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchTopTraders();
    }, []);

    if (loading) return null;

    return (
        <div className="mt-20 w-full animate-fade-in">
            <div className="flex items-center gap-3 mb-6 justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Active Alpha Nodes • Top Performers</span>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="py-4 px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest">Rank</th>
                            <th className="py-4 px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest">Institutional Identity</th>
                            <th className="py-4 px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Realized PnL</th>
                            <th className="py-4 px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Win Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {traders.map((trader, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <td className="py-4 px-8 text-xs font-black text-slate-500 tabular-nums">#0{i+1}</td>
                                <td className="py-4 px-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-primary">
                                            <Users size={14} />
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black text-white uppercase tracking-tight">{trader.username || 'Anonymous Whale'}</div>
                                            <div className="text-[8px] font-bold text-slate-600 font-mono uppercase">NODE-{trader.address?.slice(-6).toUpperCase()}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-8 text-right text-emerald-400 font-black text-xs tabular-nums">
                                    +${((trader.roi || 0) * 1240).toLocaleString()}
                                </td>
                                <td className="py-4 px-8 text-right text-white font-black text-xs tabular-nums">
                                    {(trader.win_rate * 100).toFixed(0)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 bg-primary/5 text-center">
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Institutional-Grade Alpha Matrix • Live Time-Series Analysis</span>
                </div>
            </div>
        </div>
    );
};

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
        <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden animate-fade-in flex flex-col">
            <AlphaTicker variant="mini" />
            
            <main className="flex-1 flex flex-col items-center">
                {/* Hero Section */}
                <section className="app-container relative z-10 pt-24 pb-16 flex flex-col items-center text-center">
                    {/* Background Decorative Blobs */}
                    <div className="absolute top-0 -left-20 w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse" />
                    <div className="absolute top-40 -right-20 w-[500px] h-[500px] bg-accent/10 blur-[150px] rounded-full -z-10 animate-pulse-delayed" />

                    <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-8 animate-float">
                        <Zap size={14} className="fill-primary" /> The Future of Prediction Markets
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter leading-[0.9] mb-8 uppercase">
                        Scale <span className="text-primary drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">Institutional</span><br />
                        <span className="text-white">Alpha</span> Automatically.
                    </h1>
                    
                    <p className="max-w-xl text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-12">
                        Analyze behavioral genomes of profitable whales, copy strategies via the Alpha Simulator, and execute live on Polymarket.
                    </p>

                    <div className="flex flex-col items-center gap-6">
                        <div className="p-10 bg-slate-900/60 backdrop-blur-3xl border border-primary/30 rounded-[40px] shadow-2xl hover-glow transition-all max-w-sm w-full relative">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                                ACCESS TERMINAL
                            </div>
                            
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8">Initiate Neural Link</h3>
                            
                            {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-xs font-bold">{error}</div>}

                            <div className="flex justify-center scale-110">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Login Failed')}
                                    theme="filled_black"
                                    shape="pill"
                                    text="continue_with"
                                />
                            </div>
                            <p className="mt-8 text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-loose">
                                Secure end-to-end encryption via Google OAuth.<br />
                                Agreement to <a href="#" className="text-primary hover:underline">Neural Terms</a>.
                            </p>
                        </div>

                        <div className="flex items-center gap-10 mt-4">
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-white tabular-nums">$140M+</span>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Global Vol</span>
                            </div>
                            <div className="h-10 w-px bg-slate-800" />
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-white tabular-nums">1.2k+</span>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Active Nodes</span>
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard Preview */}
                    <LeaderboardPreview />
                </section>

                {/* Features Grid */}
                <section className="app-container py-32 border-t border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-10 bg-slate-900/30 border border-white/5 rounded-[40px] hover:border-primary/30 transition-all hover-glow group">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                                <Brain size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 italic">Behavioral DNA</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">We analyze millions of on-chain data points to build psychological maps of top Polymarket earners. Discover their risk tolerance and strike rates.</p>
                        </div>

                        <div className="p-10 bg-slate-900/30 border border-white/5 rounded-[40px] hover:border-emerald-500/30 transition-all hover-glow group">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform">
                                <Target size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 italic">Alpha Simulator</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">Deploy virtual capital ($10K starting portfolio) into our time-series simulation. Backtest trader strategies before deploying real capital.</p>
                        </div>

                        <div className="p-10 bg-slate-900/30 border border-white/5 rounded-[40px] hover:border-red-500/30 transition-all hover-glow group">
                            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-8 group-hover:scale-110 transition-transform">
                                <Zap size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 italic">Vector Execution</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">Link your Web3 wallet and interface directly with Polymarket's CLOB API using Layer 2 signatures for hyper-efficient scaling.</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Login;
