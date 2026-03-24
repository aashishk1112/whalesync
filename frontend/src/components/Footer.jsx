import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="app-footer" style={{ padding: '2rem 1rem', borderTop: '1px solid var(--border)', marginTop: '4rem' }}>
            <div className="container flex justify-between items-center text-sm text-muted">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} className="text-primary" />
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>WhaleSync</span>
                    <span>&copy; 2026</span>
                </div>
                <div className="flex gap-8">
                    <Link to="/privacy" className="hover-text-primary cursor-pointer no-underline">Privacy Policy</Link>
                    <Link to="/terms" className="hover-text-primary cursor-pointer no-underline">Terms of Service</Link>
                    <Link to="/docs" className="hover-text-primary cursor-pointer no-underline">Documentation</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
