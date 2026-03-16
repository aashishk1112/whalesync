import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div className="container mt-4 animate-fade-in" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <Shield className="text-primary" size={32} />
                </div>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>Privacy Policy</h1>
            </div>

            <div className="glass-panel" style={{ padding: '3rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Last Updated: March 16, 2026
                </p>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem' }}>1. Data Collection</h2>
                    <p>WhaleSync is committed to protecting your privacy in compliance with GDPR, India DPDP Act, and CCPA. We collect the following data points to provide the Service:</p>
                    <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
                        <li><strong>Public Wallet Address</strong>: Required for authentication and tracking market interactions.</li>
                        <li><strong>Analytics & IP Logging</strong>: We log basic interaction data and IP addresses for security screening and service optimization.</li>
                        <li><strong>Cookie Data</strong>: We use essential cookies for session management and basic analytics.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem' }}>2. Zero-Knowledge Policy</h2>
                    <p>We do NOT collect, store, or transmit your wallet private keys or seed phrases. We also do not collect personal identifying information (PII) like names or physical addresses, unless explicitly provided via authorized third-party OAuth providers.</p>
                </section>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem' }}>3. Data Usage</h2>
                    <p>Your data is used exclusively to facilitate market interactions on Polymarket and to provide personalized analytics. Your off-chain data is cached only for user interface purposes and is not sold to third parties.</p>
                </section>

                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem' }}>4. Your Rights</h2>
                    <p>Under applicable law, you have the right to access, rectify, or delete your data. WhaleSync provides a "Wipe My Data" feature in the Settings panel which allows you to permanently delete all off-chain data associated with your wallet address from our systems.</p>
                </section>

                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <p>For inquiries regarding our privacy practices, please contact compliance@whalesync.example.</p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
