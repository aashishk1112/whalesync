import React from 'react';
import { BookOpen, Key, Activity, Zap } from 'lucide-react';

const Docs = () => {
    return (
        <div className="container mt-4 animate-fade-in" style={{ padding: '4rem 1rem', maxWidth: '1000px' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Documentation</h1>
                <p className="text-muted" style={{ fontSize: '1.2rem' }}>Everything you need to know about automating your predictions with WhaleSync.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                        <Zap size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Getting Started</h3>
                    <p className="text-muted">Learn how to connect your wallet, set your initial portfolio, and start your first paper simulation.</p>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ color: 'var(--accent)', marginBottom: '1rem' }}>
                        <Activity size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Automation Logic</h3>
                    <p className="text-muted">Explore how our copy-trading automation works and how we mirror top traders on Polymarket.</p>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
                        <Key size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Security & APIs</h3>
                    <p className="text-muted">Detailed overview of our Zero-Knowledge architecture and how we use Polymarket CLOB APIs.</p>
                </div>
            </div>

            <div className="glass-panel" style={{ marginTop: '3rem', padding: '3rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Frequently Asked Questions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Does WhaleSync have access to my funds?</h4>
                        <p className="text-muted">No. WhaleSync is non-custodial. We only use API credentials to interact with your proxy wallet on your behalf, which can be revoked at any time.</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>What is "Paper Simulation"?</h4>
                        <p className="text-muted">It's a sandbox environment where you can test strategies using virtual capital before committing real funds to automation.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Docs;
