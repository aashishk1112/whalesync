import React from 'react';
import { BookOpen, Key, Activity, Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Docs = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col p-6 font-sans">
            <style dangerouslySetInnerHTML={{ __html: `
                .glass-card {
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .mesh-bg {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    background: 
                        radial-gradient(circle at 10% 10%, rgba(6, 182, 212, 0.05) 0%, transparent 50%),
                        radial-gradient(circle at 90% 90%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
                }
            `}} />
            <div className="mesh-bg" />
            
            <div className="max-w-5xl w-full mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors mb-10 text-xs font-black uppercase tracking-[0.2em] no-underline cursor-pointer group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Terminal
                </Link>

                <div className="mb-14">
                    <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic leading-[0.8] mb-4">Documentation</h1>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em]">Everything required for neural-link execution</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {[
                        { icon: <Zap size={24} />, title: "Getting Started", desc: "Connect your wallet, set initial portfolio, and start paper simulation." },
                        { icon: <Activity size={24} />, title: "Automation Logic", desc: "Explore how copy-trading automation works and how we mirror top traders." },
                        { icon: <Key size={24} />, title: "Security & APIs", desc: "Overview of Zero-Knowledge architecture and Polymarket CLOB integration." }
                    ].map((card, i) => (
                        <div key={i} className="glass-card rounded-[32px] p-8 hover:border-cyan-500/30 transition-all cursor-pointer group">
                            <div className="text-cyan-400 mb-6 p-3 bg-cyan-500/5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                                {card.icon}
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-3">{card.title}</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-relaxed">{card.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="glass-card rounded-[40px] p-10 md:p-16 mb-20">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-10">Frequently Asked Questions</h2>
                    <div className="space-y-12">
                        <div>
                            <h4 className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-3">Does WhaleSync have access to my funds?</h4>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-wide leading-relaxed">No. WhaleSync is non-custodial. We only use API credentials to interact with your proxy wallet on your behalf, which can be revoked at any time.</p>
                        </div>
                        <div>
                            <h4 className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-3">What is "Paper Simulation"?</h4>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-wide leading-relaxed">It's a sandbox environment where you can test strategies using virtual capital before committing real funds to automation.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Docs;
