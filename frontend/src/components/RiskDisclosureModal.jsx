import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, ChevronDown, CheckCircle } from 'lucide-react';

const RiskDisclosureModal = ({ isOpen, onAccept, onCancel }) => {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const scrollRef = useRef(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                setHasScrolledToBottom(true);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            backdropFilter: 'blur(10px)',
            padding: '1rem'
        }}>
            <div className="glass-panel animate-fade-in" style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '2rem',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                    <ShieldAlert size={28} />
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Mandatory Risk Disclosure</h2>
                </div>

                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        overflowY: 'auto',
                        fontSize: '0.9rem',
                        lineHeight: '1.6',
                        color: 'var(--text-muted)',
                        marginBottom: '2rem',
                        border: '1px solid var(--border)',
                        flex: 1
                    }}
                >
                    <h4 style={{ color: 'var(--text-main)', marginTop: 0 }}>1. Nature of Prediction Markets</h4>
                    <p>Prediction markets are inherently volatile. By using WhaleSync automation tools, you acknowledge that market outcomes are uncertain and past performance by followed traders does not guarantee future results.</p>

                    <h4 style={{ color: 'var(--text-main)' }}>2. Automation & Execution Risk</h4>
                    <p>Automated interaction tools rely on software logic, API connectivity, and blockchain network stability. WhaleSync is not liable for losses resulting from software bugs, API downtime, or network congestion that may prevent or delay trades.</p>

                    <h4 style={{ color: 'var(--text-main)' }}>3. Non-Custodial Responsibility</h4>
                    <p>WhaleSync is a non-custodial platform. While we store API credentials for automation, we never store your private keys. You are solely responsible for securing your wallet seed phrase and managing your Polymarket proxy wallet permissions.</p>

                    <h4 style={{ color: 'var(--text-main)' }}>4. No Investment Advice</h4>
                    <p>The platform provides market interaction tools and analytics. It does not provide financial, legal, or investment advice. You should consult with professional advisors before engaging in any predictive activities.</p>

                    <h4 style={{ color: 'var(--text-main)' }}>5. Sanctions & Compliance</h4>
                    <p>By proceeding, you certify that you are not a resident of a sanctioned jurisdiction (e.g., USA) and that your funds are not subject to AML flags. WhaleSync performs mandatory screening and reserves the right to terminate accounts that fail compliance checks.</p>
                    
                    {!hasScrolledToBottom && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0.5rem', 
                            color: 'var(--primary)', 
                            fontWeight: 'bold',
                            marginTop: '1rem',
                            fontSize: '0.8rem'
                        }}>
                            <ChevronDown size={14} className="animate-float" /> Scroll to bottom to accept
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={onCancel}
                        className="btn-outline"
                        style={{ flex: 1, padding: '0.75rem' }}
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={!hasScrolledToBottom}
                        onClick={onAccept}
                        className="btn-primary"
                        style={{ 
                            flex: 1, 
                            padding: '0.75rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0.5rem',
                            opacity: hasScrolledToBottom ? 1 : 0.5,
                            cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {hasScrolledToBottom ? <CheckCircle size={18} /> : null}
                        I Have Read & Accept Risks
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RiskDisclosureModal;
