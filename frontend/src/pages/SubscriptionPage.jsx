import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Check, Zap, Crown, ShieldCheck } from 'lucide-react';

const SubscriptionPage = () => {
    const { user } = useContext(AuthContext);
    const [plans, setPlans] = useState([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
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

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/config/plans`);
                const data = await res.json();
                if (data.plans) {
                    // Map DB tiers to UI structure
                    const iconMap = {
                        free: <Zap size={24} className="text-muted" />,
                        pro: <Crown size={24} style={{ color: '#3b82f6' }} />,
                        elite: <ShieldCheck size={24} style={{ color: '#10b981' }} />
                    };
                    
                    const formattedPlans = Object.entries(data.plans).map(([id, plan]) => ({
                        id,
                        name: plan.name,
                        price: plan.price_display || `$${plan.price || 0}`,
                        period: plan.period || '/mo',
                        description: plan.description || '',
                        features: plan.features || [],
                        icon: iconMap[id] || <Zap size={24} />,
                        highlight: plan.highlight || false,
                        buttonText: plan.button_text || (id === 'pro' ? 'Upgrade to Pro' : id === 'elite' ? 'Go Elite' : 'Current Plan'),
                        isCurrent: user?.subscription_tier === id,
                        disabled: id === 'free'
                    }));
                    
                    // Sort plans if necessary (e.g. free, pro, elite)
                    const order = ['free', 'pro', 'elite'];
                    formattedPlans.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
                    
                    setPlans(formattedPlans);
                }
            } catch (err) {
                console.error("Failed to fetch plans", err);
            } finally {
                setIsLoadingPlans(false);
            }
        };
        fetchPlans();
    }, [user?.subscription_tier]);

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
                {isLoadingPlans ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
                        <div className="spinner"></div>
                        <p className="mt-4 text-muted">Loading intelligence tiers...</p>
                    </div>
                ) : plans.map((tier) => (
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
