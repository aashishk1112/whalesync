import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col p-6 font-sans">
            <style dangerouslySetInnerHTML={{ __html: `
                .glass-card {
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
            `}} />
            
            <div className="max-w-4xl w-full mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors mb-10 text-xs font-black uppercase tracking-[0.2em] no-underline cursor-pointer group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Terminal
                </Link>

                <div className="glass-card rounded-[40px] p-10 md:p-16">
                    <div className="flex items-center gap-6 mb-12">
                        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                            <FileText className="text-emerald-400" size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Terms of Service</h1>
                    </div>

                    <div className="space-y-12 text-slate-400 leading-relaxed font-bold text-sm uppercase tracking-wide">
                        <p className="text-slate-500 mb-8 font-black">
                            Last Updated: March 16, 2026
                        </p>

                        <section className="space-y-4">
                            <h2 className="text-white text-xl font-black tracking-tight">1. Introduction</h2>
                            <p>Welcome to WhaleSync. These Terms of Service ("Terms") govern your access to and use of the WhaleSync platform, including our website, analytics dashboard, and prediction automation tools. WhaleSync is operated as a non-custodial interface for third-party prediction markets.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-white text-xl font-black tracking-tight">2. Non-Custodial Nature</h2>
                            <p>WhaleSync is a non-custodial interface. We do not at any point hold, custody, or control user funds; store user private keys or seed phrases; or facilitate the exchange of digital assets directly on our servers. The Service acts solely as a technical tool to facilitate interactions between your self-custodied wallet and the Polymarket CLOB API.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-white text-xl font-black tracking-tight">3. Use of Prediction Markets</h2>
                            <p>WhaleSync provides automation tools for interacting with Polymarket. You acknowledge that you are interacting directly with third-party protocols, WhaleSync does not operate a trading exchange, and predictions involve substantial risk of loss.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-white text-xl font-black tracking-tight">4. Eligibility & Prohibited Jurisdictions</h2>
                            <p>You must be of legal age and reside in a jurisdiction where use of prediction markets is permitted. Use of WhaleSync from prohibited jurisdictions, including but not limited to the United States of America, North Korea, Iran, or any OFAC-sanctioned territory, is strictly forbidden.</p>
                        </section>

                        <div className="mt-12 pt-8 border-t border-white/5 text-[10px] uppercase font-black tracking-widest text-slate-500">
                            <p>Please review these terms periodically as they may be updated at any time.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
