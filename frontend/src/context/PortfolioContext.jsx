import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AuthContext } from './AuthContext';

export const PortfolioContext = createContext(null);

export const PortfolioProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [portfolio, setPortfolio] = useState({
        balance: 0,
        total_pnl: 0,
        open_positions: []
    });
    const [settings, setSettings] = useState({
        simulation_capital: 0,
        source_slots: 0,
        copy_sources: []
    });

    const [strategies, setStrategies] = useState([]);

    const fetchStrategies = useCallback(async () => {
        if (!user) return;
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/strategies?user_id=${user.user_id}`);
            const data = await res.json();
            if (data.strategies) setStrategies(data.strategies);
        } catch (err) {
            console.error("Failed to fetch strategies", err);
        }
    }, [user?.user_id]);

    const fetchPortfolio = useCallback(async () => {
        if (!user) return;
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/portfolio/me?user_id=${user.user_id}`);
            const data = await res.json();
            if (data.portfolio) setPortfolio(data.portfolio);
            if (data.settings) setSettings(data.settings);
            
            // Also fetch actual strategies from the dedicated endpoint
            await fetchStrategies();
        } catch (err) {
            console.error("Failed to fetch portfolio", err);
        }
    }, [user?.user_id, fetchStrategies]);

    const fetchDefaults = useCallback(async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/config/defaults`);
            const data = await res.json();
            if (data) {
                setSettings(prev => ({
                    ...prev,
                    simulation_capital: data.default_capital,
                    source_slots: data.default_slots
                }));
            }
        } catch (err) {
            console.error("Failed to fetch system defaults", err);
        }
    }, []);

    useEffect(() => {
        fetchDefaults();
    }, [fetchDefaults]);

    useEffect(() => {
        if (user?.user_id) {
            fetchPortfolio();
        }
    }, [user?.user_id, fetchPortfolio]);

    const simulateTrade = async (tradeDetails) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/portfolio/simulate_trade?user_id=${user.user_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tradeDetails)
            });
            const data = await res.json();
            if (res.ok) {
                await fetchPortfolio(); // Refresh to get synced DB state
                return { success: true };
            }
            return { success: false, error: data.detail || 'Trade failed' };
        } catch (err) {
            return { success: false, error: 'Network error placing trade' };
        }
    };

    const updateCapital = async (capital) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/portfolio/settings/capital?user_id=${user.user_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ capital })
            });
            if (res.ok) {
                await fetchPortfolio(); // Refresh to get synced DB state
                return { success: true };
            }
            return { success: false };
        } catch (err) { return { success: false }; }
    };

    const addSource = async (source) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/portfolio/copy-sources?user_id=${user.user_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(source)
            });
            const data = await res.json();
            if (res.ok) {
                setSettings(prev => ({ ...prev, copy_sources: [...prev.copy_sources, data.source] }));
                return { success: true };
            }
            return { success: false, error: data.detail };
        } catch (err) { return { success: false, error: "Network error" }; }
    };

    const toggleSource = async (sourceId, active) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/portfolio/copy-sources/${sourceId}?user_id=${user.user_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active })
            });
            if (res.ok) {
                setSettings(prev => ({
                    ...prev,
                    copy_sources: prev.copy_sources.map(s => s.id === sourceId ? { ...s, active } : s)
                }));
                return { success: true };
            }
        } catch (err) { console.error(err); }
        return { success: false };
    };

    const terminateSource = async (sourceId) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/portfolio/copy-sources/${sourceId}?user_id=${user.user_id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setSettings(prev => ({
                    ...prev,
                    copy_sources: prev.copy_sources.filter(s => s.id !== sourceId)
                }));
                return { success: true };
            }
        } catch (err) { console.error(err); }
        return { success: false };
    };

    const linkPolymarket = async (address, creds = null) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/portfolio/link-polymarket?user_id=${user.user_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, creds })
            });
            const data = await res.json();
            if (res.ok) {
                await fetchPortfolio();
                return { success: true };
            }
            return { success: false, error: data.detail };
        } catch (err) { return { success: false, error: "Network error" }; }
    };

    const acceptDisclosure = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/portfolio/accept-disclosure?user_id=${user.user_id}`, {
                method: 'POST'
            });
            if (res.ok) {
                await fetchPortfolio();
                return { success: true };
            }
        } catch (err) { console.error(err); }
        return { success: false };
    };

    const wipeUserData = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/portfolio/wipe-data?user_id=${user.user_id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                return { success: true };
            }
        } catch (err) { console.error(err); }
        return { success: false };
    };

    const value = useMemo(() => ({
        portfolio,
        settings,
        strategies,
        refreshPortfolio: fetchPortfolio,
        refreshStrategies: fetchStrategies,
        simulateTrade,
        updateCapital,
        addSource,
        toggleSource,
        terminateSource,
        linkPolymarket,
        wipeUserData,
        acceptDisclosure
    }), [portfolio, settings, strategies, fetchPortfolio, fetchStrategies]);

    return (
        <PortfolioContext.Provider value={value}>
            {children}
        </PortfolioContext.Provider>
    );
};
