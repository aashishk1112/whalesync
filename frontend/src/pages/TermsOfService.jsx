import React from 'react';
import { FileText } from 'lucide-react';

const TermsOfService = () => {
    return (
        <div className="container mt-4 animate-fade-in" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <FileText className="text-success" size={32} />
                </div>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>Terms of Service</h1>
            </div>

            <div className="glass-panel" style={{ padding: '3rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Last Updated: March 16, 2026
                </p>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem' }}>1. Introduction</h2>
                    <p>Welcome to WhaleSync. These Terms of Service ("Terms") govern your access to and use of the WhaleSync platform, including our website, analytics dashboard, and prediction automation tools (collectively, the "Service"). WhaleSync is operated as a non-custodial interface for third-party prediction markets.</p>
                </section>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem' }}>2. Non-Custodial Nature</h2>
                    <p>WhaleSync is a **non-custodial interface**. We do not at any point hold, custody, or control user funds; store user private keys or seed phrases; or facilitate the exchange of digital assets directly on our servers. The Service acts solely as a technical tool to facilitate interactions between your self-custodied wallet and the Polymarket CLOB API.</p>
                </section>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem' }}>3. Use of Prediction Markets</h2>
                    <p>WhaleSync provides automation tools for interacting with Polymarket. You acknowledge that you are interacting directly with third-party protocols, WhaleSync does not operate a trading exchange, and predictions involve substantial risk of loss.</p>
                </section>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem' }}>4. Eligibility & Prohibited Jurisdictions</h2>
                    <p>You must be of legal age and reside in a jurisdiction where use of prediction markets is permitted. Use of WhaleSync from prohibited jurisdictions, including but not limited to the United States of America, North Korea, Iran, or any OFAC-sanctioned territory, is strictly forbidden.</p>
                </section>

                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <p>Please review these terms periodically as they may be updated at any time.</p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
