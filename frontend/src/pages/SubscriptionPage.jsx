import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Check, Zap, Crown, ShieldCheck } from 'lucide-react';

const SubscriptionPage = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(null);

    const handleUpgrade = async (tier) => {
        setLoading(tier);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/subscriptions/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier, user_id: user.user_id })
            });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                alert("Failed to create checkout session");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred");
        } finally {
            setLoading(null);
        }
    };

    const tiers = [
        {
            id: 'free',
            name: 'Free',
            price: '$0',
            description: 'Perfect for getting started with WhaleSync',
            features: [
                '1 trader follow',
                'Delayed signals (5 minutes)',
                'Limited capital simulation ($10k)',
                'Basic dashboard'
            ],
            icon: <Zap size={24} className="text-muted" />,
            buttonText: 'Current Plan',
            disabled: true,
            isCurrent: user?.subscription_tier === 'free' || !user?.subscription_tier
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '$20',
            period: '/mo',
            description: 'For serious traders seeking real-time precision',
            features: [
                '10 trader slots',
                'Real-time signals',
                'Portfolio analytics',
                'Basic AI suggestions',
                'Up to $50k simulated capital'
            ],
            icon: <Crown size={24} style={{ color: '#3b82f6' }} />,
            buttonText: 'Upgrade to Pro',
            isCurrent: user?.subscription_tier === 'pro',
            highlight: true
        },
        {
            id: 'elite',
            name: 'Elite',
            price: '$75',
            period: '/mo',
            description: 'The ultimate intelligence platform for whales',
            features: [
                'Unlimited traders',
                'AI auto-copy (simulated)',
                'Whale alerts',
                'Early signal access',
                'Up to $250k simulated capital'
            ],
            icon: <ShieldCheck size={24} style={{ color: '#10b981' }} />,
            buttonText: 'Go Elite',
            isCurrent: user?.subscription_tier === 'elite'
        }
    ];

    return (
        <div className="container mt-4 animate-fade-in" style={{ paddingBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className="text-gradient-primary" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Choose Your Intelligence Tier</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    Unlock the full potential of WhaleSync with real-time signals, AI-powered insights, and unlimited trader follows.
                </p>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '2rem', 
                marginTop: '2rem' 
            }}>
                {tiers.map((tier) => (
                    <div 
                        key={tier.id} 
                        className={`glass-panel hover-glow ${tier.highlight ? 'animate-float' : ''}`}
                        style={{ 
                            padding: '2.5rem', 
                            display: 'flex', 
                            flexDirection: 'column',
                            position: 'relative',
                            border: tier.highlight ? '1px solid var(--primary)' : 'var(--glass-border)'
                        }}
                    >
                        {tier.highlight && (
                            <div style={{ 
                                position: 'absolute', 
                                top: '-12px', 
                                left: '50%', 
                                transform: 'translateX(-50%)',
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}>
                                Most Popular
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: 0 }}>{tier.name}</h2>
                            {tier.icon}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{tier.price}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{tier.period}</span>
                        </div>

                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', minHeight: '3rem' }}>
                            {tier.description}
                        </p>

                        <div style={{ flexGrow: 1, marginBottom: '2.5rem' }}>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {tier.features.map((feature, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                                        <Check size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button 
                            className={tier.isCurrent ? 'btn-outline' : 'btn-primary'}
                            style={{ width: '100%', padding: '1rem' }}
                            disabled={tier.isCurrent || (loading && loading === tier.id)}
                            onClick={() => handleUpgrade(tier.id)}
                        >
                            {loading === tier.id ? 'Connecting to Stripe...' : (tier.isCurrent ? 'Current Plan' : tier.buttonText)}
                        </button>
                    </div>
                ))}
            </div>
            
            <div style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.7 }}>
                <p>All plans include Google Auth, P&L tracking, and basic referral rewards.</p>
                <p style={{ fontSize: '0.8rem' }}>Billing is handled securely via Stripe. Cancel anytime.</p>
            </div>
        </div>
    );
};

export default SubscriptionPage;
