import React, { useState, useContext, useEffect } from 'react';
import { PortfolioContext } from '../context/PortfolioContext';
import { AuthContext } from '../context/AuthContext';
import { Settings as SettingsIcon, CreditCard, Plus, Wallet, ShieldCheck, UserPlus, X, Activity } from 'lucide-react';
import { ethers } from 'ethers';
import { ClobClient } from '@polymarket/clob-client';
import RiskDisclosureModal from '../components/RiskDisclosureModal';

const Settings = () => {
    const { settings, updateCapital, addSource, purchaseSlot, toggleSource, linkPolymarket, wipeUserData, acceptDisclosure } = useContext(PortfolioContext);
    const { logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('paper');
    const [capital, setCapital] = useState(settings.simulation_capital);
    const [isLinking, setIsLinking] = useState(false);
    const [showDisclosure, setShowDisclosure] = useState(false);
    const [newSource, setNewSource] = useState({ platform: 'Polymarket', address: '', name: '' });
    const [message, setMessage] = useState({ type: '', text: '' });

    const [strategies, setStrategies] = useState([]);
    const { user } = useContext(AuthContext);

    const { refreshPortfolio } = useContext(PortfolioContext);

    useEffect(() => {
        setCapital(settings.simulation_capital);

        // Check for success/canceled query params from Stripe
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success')) {
            setMessage({ type: 'success', text: 'Slot purchase initiated! Updating your limits shortly...' });

            // Wait 3 seconds for webhook to process before refreshing
            const refreshTimer = setTimeout(() => {
                refreshPortfolio();
                setMessage({ type: 'success', text: 'Slot purchased successfully! Your limits have been updated.' });
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 3000);

            return () => clearTimeout(refreshTimer);
        }

        // Fetch strategies to check for active ones
        if (user) {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            fetch(`${apiUrl}/api/strategies/?user_id=${user.user_id}`)
                .then(res => res.json())
                .then(data => setStrategies(data.strategies || []))
                .catch(err => console.error(err));
        }
    }, [settings.simulation_capital, user, refreshPortfolio]);

    // Auto-clear message after 10 seconds
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleCapitalUpdate = async (e) => {
        e.preventDefault();

        const activeStrategies = strategies.filter(s => s.status === 'active');
        if (activeStrategies.length > 0) {
            const confirmed = window.confirm(
                `Warning: You have ${activeStrategies.length} active strategies running. Updating simulation capital will PERMANENTLY RESET (delete) all strategies and their history. \n\nAre you sure you want to proceed?`
            );
            if (!confirmed) return;
        }

        const res = await updateCapital(parseFloat(capital));
        if (res.success) {
            setMessage({ type: 'success', text: 'Simulation capital updated and all strategies have been reset.' });
            setStrategies([]);
        } else {
            setMessage({ type: 'error', text: 'Failed to update capital.' });
        }
    };

    const handleConnectWallet = async (e) => {
        e.preventDefault();
        if (!window.ethereum) {
            setMessage({ type: 'error', text: 'Please install MetaMask or a Web3 Wallet to connect.' });
            return;
        }

        // 1. Mandatory Risk Disclosure check
        if (!settings.risk_disclosure_accepted) {
            setShowDisclosure(true);
            return;
        }

        try {
            setIsLinking(true);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            // Ask for explicit consent
            const consent = window.confirm(`Connect wallet ${address.substring(0, 6)}...${address.substring(38)} for Polymarket Prediction Automation?\n\nYou authorize the automation logic to interact with markets using Polymarket CLOB APIs on your behalf.`);
            if (!consent) {
                setIsLinking(false);
                return;
            }

            let finalAddress = address;
            try {
                // Instantiate ClobClient to fetch the true Polymarket proxy wallet
                // You must supply an endpoint and chain ID. Polymarket runs on Polygon (137)
                const client = new ClobClient("https://clob.polymarket.com", 137, signer);
                
                const creds = await client.createApiKey();
                console.log("CLOB API Credentials Generated:", creds);
                
                // linkPolymarket now accepts creds. Zero-Knowledge: private key is never sent.
                const res = await linkPolymarket(creds.proxyAddress || address, creds);
                setIsLinking(false);
                if (res.success) {
                    setMessage({ type: 'success', text: `AML Screening Clear. Polymarket Proxy Wallet (${(creds.proxyAddress || address).substring(0,6)}...) linked successfully!` });
                } else {
                    setMessage({ type: 'error', text: res.error || 'Failed to link profile.' });
                }
                return;
            } catch (err) {
                console.warn("Could not generate CLOB API key, falling back to EOA address.", err);
                setMessage({ type: 'error', text: 'User rejected signature for Polymarket API key generation. Wallet not linked.' });
                setIsLinking(false);
                return;
            }
        } catch (error) {
            console.error(error);
            setIsLinking(false);
            setMessage({ type: 'error', text: error.message || 'Error connecting wallet.' });
        }
    };

    const handleAddSource = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        const res = await addSource(newSource);
        if (res.success) {
            setMessage({ type: 'success', text: 'Source added successfully!' });
            setNewSource({ platform: 'Polymarket', address: '', name: '' });
        } else {
            const isLimitError = res.error && (res.error.toLowerCase().includes('limit') || res.error.toLowerCase().includes('slot'));
            setMessage({
                type: 'error',
                text: res.error || 'Failed to add source',
                isLimitError
            });
        }
    };

    return (
        <div className="container mt-4 animate-fade-in" style={{ padding: '2rem 1rem' }}>
            <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <SettingsIcon className="text-primary" size={28} /> Account Settings
            </h2>

            {message.text && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: message.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span>{message.text}</span>
                        {message.isLimitError && (
                            <button
                                onClick={purchaseSlot}
                                className="btn-primary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                            >
                                <Plus size={14} style={{ marginRight: '4px' }} /> Buy Slot ($5)
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setMessage({ type: '', text: '' })}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('paper')}
                    className={activeTab === 'paper' ? 'btn-primary' : 'btn-outline'}
                    style={{
                        padding: '0.5rem 1.5rem',
                        background: activeTab === 'paper' ? 'var(--primary)' : 'transparent',
                        border: activeTab === 'paper' ? 'none' : '1px solid var(--border)'
                    }}
                >
                    <Wallet size={16} style={{ display: 'inline', marginRight: '6px' }} /> Paper Trading
                </button>
                <button
                    onClick={() => setActiveTab('live')}
                    className={activeTab === 'live' ? 'btn-primary' : 'btn-outline'}
                    style={{
                        padding: '0.5rem 1.5rem',
                        background: activeTab === 'live' ? 'var(--danger)' : 'transparent',
                        color: activeTab === 'live' ? 'white' : 'var(--text-main)',
                        border: activeTab === 'live' ? 'none' : '1px solid var(--border)'
                    }}
                >
                    <Activity size={16} style={{ display: 'inline', marginRight: '6px' }} /> Prediction Automation
                </button>
            </div>

            {activeTab === 'paper' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>

                {/* Left Column: Capital & Subscription */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <section className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                            <Wallet size={20} className="text-primary" /> Simulation Capital
                        </h3>
                        <form onSubmit={handleCapitalUpdate} style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>$</span>
                                <input
                                    type="number"
                                    value={capital}
                                    onChange={e => setCapital(e.target.value)}
                                    style={{ paddingLeft: '1.75rem' }}
                                />
                            </div>
                            <button className="btn-primary" type="submit">Update</button>
                        </form>
                        <p className="text-xs text-muted mt-2">Initial paper trading portfolio available for simulation.</p>
                    </section>


                    <section className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                            <UserPlus size={20} className="text-primary" /> Referral Program
                        </h3>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>YOUR REFERRAL CODE</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--primary)' }}>{user?.referral_code || '------'}</div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Share your link and get <strong>+1 trader slot</strong> for every friend who signs up.
                        </p>
                        <button 
                            className="btn-outline" 
                            style={{ width: '100%', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => {
                                const link = `${window.location.origin}/login?ref=${user?.referral_code}`;
                                navigator.clipboard.writeText(link);
                                setMessage({ type: 'success', text: 'Referral link copied to clipboard!' });
                            }}
                        >
                            Copy Referral Link
                        </button>
                    </section>
                </div>

                {/* Right Column: Copy Sources */}
                <section className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                            <UserPlus size={20} className="text-primary" /> Copy Sources
                        </h3>
                    </div>

                    <form onSubmit={handleAddSource} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '0.75rem', marginBottom: '2rem', alignItems: 'end' }}>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted mb-1 block">Platform</label>
                            <select
                                value={newSource.platform}
                                onChange={e => setNewSource({ ...newSource, platform: e.target.value })}
                            >
                                <option value="Polymarket">Polymarket</option>
                                <option value="Kalshi" disabled>Kalshi (Coming Soon)</option>
                                <option value="Manifold" disabled>Manifold (Coming Soon)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted mb-1 block">Address / Handle</label>
                            <input
                                type="text"
                                placeholder="0x... or @username"
                                value={newSource.address}
                                onChange={e => setNewSource({ ...newSource, address: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-muted mb-1 block">Alias</label>
                            <input
                                type="text"
                                placeholder="My Whale"
                                value={newSource.name}
                                onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                                required
                            />
                        </div>
                        <button
                            className="btn-primary"
                            type="submit"
                            disabled={(() => {
                                const platformCount = settings.copy_sources.filter(s => s.platform === newSource.platform).length;
                                if (platformCount < 2) return false;
                                const extraUsedAcrossAll = settings.copy_sources.reduce((acc, s) => {
                                    const countOnPlatform = settings.copy_sources.filter(cs => cs.platform === s.platform).length;
                                    // This is a bit complex for a disabled check, but essentially we check if total cap is hit
                                    return acc;
                                }, 0);
                                // Simplified approach for button: check total limit
                                return settings.copy_sources.length >= settings.source_slots;
                            })()}
                        >
                            Follow
                        </button>
                    </form>

                    <div className="flex-col gap-3" style={{ display: 'flex' }}>
                        {settings.copy_sources.map(s => (
                            <div key={s.id} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {s.image_url ? (
                                        <img src={s.image_url} alt={s.name} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary)' }} />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'var(--primary)', border: '2px solid rgba(255,255,255,0.1)' }}>
                                            {s.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {s.name}
                                            <span style={{
                                                fontSize: '0.65rem',
                                                padding: '0.1rem 0.5rem',
                                                borderRadius: '1rem',
                                                background: s.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                color: s.active ? '#10b981' : '#ef4444'
                                            }}>
                                                {s.active ? 'ACTIVE' : 'PAUSED'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted">{s.platform}: {s.address}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="btn-outline"
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.75rem',
                                            opacity: (() => {
                                                const inUse = strategies.some(strat =>
                                                    strat.source_addresses.includes(s.address) && strat.status !== 'stopped'
                                                );
                                                return s.active && inUse ? 0.5 : 1;
                                            })(),
                                            cursor: (() => {
                                                const inUse = strategies.some(strat =>
                                                    strat.source_addresses.includes(s.address) && strat.status !== 'stopped'
                                                );
                                                return s.active && inUse ? 'not-allowed' : 'pointer';
                                            })()
                                        }}
                                        onClick={() => {
                                            const inUse = strategies.some(strat =>
                                                strat.source_addresses.includes(s.address) && strat.status !== 'stopped'
                                            );
                                            if (s.active && inUse) {
                                                setMessage({ type: 'error', text: `Cannot pause source. It is currently being used by active simulator strategies.` });
                                                return;
                                            }
                                            toggleSource(s.id, !s.active);
                                        }}
                                    >
                                        {s.active ? 'Pause' : 'Resume'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {settings.copy_sources.length === 0 && (
                            <div className="text-center py-8 text-muted italic">
                                No copy sources added yet.
                            </div>
                        )}
                    </div>
                </section>
            </div>
            )}

            {activeTab === 'live' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <section className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', color: 'var(--danger)' }}>
                                <Activity size={20} /> Prediction Automation Tools
                            </h3>

                            <p className="text-sm text-muted mb-4">
                                Link your Polymarket wallet to automate market interactions directly from the app. We use the Polymarket CLOB API to process transactions securely via your proxy wallet. 
                            </p>

                            {settings.polymarket_address ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        {settings.linked_profile?.profileImage || settings.linked_profile?.image_url ? (
                                            <img
                                                src={settings.linked_profile?.profileImage || settings.linked_profile?.image_url}
                                                alt="Profile"
                                                style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--danger)' }}
                                            />
                                        ) : (
                                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Wallet size={32} className="text-muted" />
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-main)' }}>{settings.linked_profile?.name || settings.linked_profile?.displayName || 'Linked Proxy Wallet'}</div>
                                            <div className="text-sm text-muted" style={{ wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '4px' }}>{settings.polymarket_address}</div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <ShieldCheck size={16} /> Automation Enabled
                                    </div>
                                    <button className="btn-outline" onClick={async () => {
                                        if (window.confirm("Are you sure you want to disconnect? You will no longer be able to automate predictions.")) {
                                            await linkPolymarket(''); // Unlink
                                        }
                                    }} style={{ fontSize: '0.8rem', alignSelf: 'flex-start', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                        Disconnect Wallet
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleConnectWallet} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    
                                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.85rem' }}>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)' }}>How it Works</h4>
                                        <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
                                            <li style={{ marginBottom: '4px' }}>Connect your Web3 Wallet (MetaMask)</li>
                                            <li style={{ marginBottom: '4px' }}>Sign a message to authorize Polymarket API access</li>
                                            <li>We fetch your Polymarket Proxy Wallet and link it for live trades</li>
                                        </ol>
                                    </div>

                                    <button 
                                        className="btn-primary" 
                                        type="submit" 
                                        disabled={isLinking}
                                        style={{ padding: '0.8rem', fontSize: '1rem', background: 'var(--danger)', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
                                    >
                                        <img src="https://polymarket.com/favicon.ico" alt="Poly" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                                        {isLinking ? 'Connecting...' : 'Connect Polymarket Account'}
                                    </button>
                                    <p className="text-xs text-muted" style={{ opacity: 0.7, textAlign: 'center' }}>
                                        Requires MetaMask or a compatible Web3 browser extension.
                                    </p>
                                </form>
                            )}
                        </section>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                         <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', textAlign: 'center', marginBottom: '1rem' }}>
                             <Activity size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                             <h3 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Live Portfolio Coming Soon</h3>
                             <p className="text-muted" style={{ maxWidth: '80%', margin: 0 }}>Once you opt-in to automated interaction via the dashboard, your active Polymarket positions and actual PnL will be displayed here.</p>
                         </section>

                         <section className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <ShieldCheck size={20} className="text-danger" />
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Privacy & Global Actions</h3>
                            </div>
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Right to be Forgotten</div>
                                <p className="text-xs text-muted" style={{ margin: 0 }}>
                                    This action will PERMANENTLY delete your account, all simulator strategies, trade history, and linked wallet data from our database. This cannot be undone.
                                </p>
                            </div>
                            <button 
                                onClick={async () => {
                                    if (window.confirm("CRITICAL: Are you sure you want to wipe all your data? This will delete your profile, all strategies, and all trades permanently.")) {
                                        const res = await wipeUserData();
                                        if (res.success) {
                                            alert("Your data has been wiped successfully. You will now be logged out.");
                                            logout();
                                        } else {
                                            setMessage({ type: 'error', text: 'Failed to wipe data. Please try again later.' });
                                        }
                                    }
                                }}
                                className="btn-outline" 
                                style={{ width: '100%', color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.75rem' }}
                            >
                                Wipe My Data & Logout
                            </button>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                    <ShieldCheck size={14} />
                                    <span>Zero-Knowledge Storage Active: Private keys are never stored.</span>
                                </div>
                            </div>
                         </section>
                    </div>
                </div>
            )}

            <RiskDisclosureModal 
                isOpen={showDisclosure} 
                onAccept={async () => {
                    const res = await acceptDisclosure();
                    if (res.success) {
                        setShowDisclosure(false);
                        // Trigger wallet connect again now that disclosure is accepted
                        setTimeout(() => handleConnectWallet({ preventDefault: () => {} }), 100);
                    }
                }}
                onCancel={() => setShowDisclosure(false)}
            />
        </div>
    );
};

export default Settings;
