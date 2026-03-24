import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
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
                        <div className="bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/20">
                            <Shield className="text-cyan-400" size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Privacy Policy</h1>
                    </div>

                    <div className="glass-panel space-y-12 text-slate-400 leading-relaxed font-bold text-sm uppercase tracking-wide">
                        <p className="text-slate-500 mb-8 font-black">
                            Last Updated: March 16, 2026
                        </p>

                        <section className="space-y-4">
                            <h2 className="text-white text-xl font-black tracking-tight">1. Data Collection</h2>
                            <p>WhaleSync is committed to protecting your privacy in compliance with GDPR, India DPDP Act, and CCPA. We collect the following data points to provide the Service:</p>
                            <ul className="list-disc pl-5 mt-4 space-y-2">
                                <li><strong>Public Wallet Address</strong>: Required for authentication and tracking.</li>
                                <li><strong>Analytics & IP Logging</strong>: We log basic interaction data for security.</li>
                                <li><strong>Cookie Data</strong>: We use essential session cookies.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-white text-xl font-black tracking-tight">2. Zero-Knowledge Policy</h2>
                            <p>We do NOT collect, store, or transmit your wallet private keys or seed phrases. We also do not collect personal identifying information (PII) like names or physical addresses, unless explicitly provided via authorized third-party OAuth providers.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-white text-xl font-black tracking-tight">3. Data Usage</h2>
                            <p>Your data is used exclusively to facilitate market interactions on Polymarket and to provide personalized analytics. Your off-chain data is cached only for user interface purposes and is not sold to third parties.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-white text-xl font-black tracking-tight">4. Your Rights</h2>
                            <p>Under applicable law, you have the right to access, rectify, or delete your data. WhaleSync provides a "Wipe My Data" feature in the Settings panel which allows you to permanently delete all off-chain data associated with your wallet address from our systems.</p>
                        </section>

                        <div className="mt-12 pt-8 border-t border-white/5 text-[10px] uppercase font-black tracking-widest text-slate-500 text-center md:text-left">
                            <p>For inquiries regarding our privacy practices, please contact compliance@whalesync.terminal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
