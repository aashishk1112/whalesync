import React, { useContext, useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const AlphaTicker = ({ variant = 'default' }) => {
    const { user } = useContext(AuthContext);
    const isLoggedIn = !!user;
    const [opportunities, setOpportunities] = useState([]);

    useEffect(() => {
        if (!isLoggedIn) return; // Guard inside the effect if necessary
        
        const fetchSignals = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/markets/ticker/signals`);
                if (res.ok) {
                    const data = await res.json();
                    setOpportunities(data.signals || []);
                }
            } catch (err) {
                console.error("Error fetching ticker signals:", err);
            }
        };

        fetchSignals();
        // Refresh every 5 minutes
        const interval = setInterval(fetchSignals, 300000);
        return () => clearInterval(interval);
    }, [isLoggedIn]); // Added isLoggedIn dependency

    const handleTickerClick = (e, url) => {
        if (!isLoggedIn) {
            e.preventDefault();
            console.log("Navigation restricted to authenticated users.");
        }
    };

    // Uses live opportunities only, no static fallback
    const tickerItems = opportunities.length > 0 ? opportunities : [{ label: "Awaiting Live Signals...", amount: "SYNCING", time: "live", type: "SYSTEM", url: "#" }];

    if (!isLoggedIn) return null;

    if (variant === 'mini') {
        return (
            <div className="w-full bg-primary/10 border-b border-primary/20 h-10 flex items-center overflow-hidden whitespace-nowrap relative z-10 pause-on-hover">
                <div className="absolute left-0 z-30 h-full flex items-center px-4 bg-primary text-[8px] font-black uppercase tracking-[0.2em] text-white">
                    LIVE ALPHA
                </div>
                <div className="flex gap-12 animate-marquee">
                    {[...tickerItems, ...tickerItems, ...tickerItems].map((op, i) => (
                        <a 
                            key={i} 
                            href={op.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => handleTickerClick(e, op.url)}
                            className={`flex items-center gap-4 text-[10px] font-bold no-underline ${isLoggedIn ? 'cursor-pointer hover:text-white transition-colors' : 'cursor-default opacity-80'}`}
                        >
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border ${
                                op.type === 'CRITICAL' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-primary/20 border-primary/40 text-primary'
                            }`}>{op.type}</span>
                            <span className="text-white/60 uppercase">{op.label}</span>
                            <span className="text-emerald-400 font-black tracking-tighter">{op.amount}</span>
                            <span className="text-white/30 font-black tracking-tighter uppercase">{op.time}</span>
                        </a>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="relative mb-10 h-12 rounded-2xl border border-primary/30 bg-primary/5 shadow-inner overflow-hidden flex items-center pause-on-hover z-10">
            <div className="absolute left-0 z-30 h-full flex items-center px-6 bg-primary text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl">
                LIVE ALPHA
            </div>
            <div className="flex gap-16 py-2 animate-marquee whitespace-nowrap pl-40">
                {[...tickerItems, ...tickerItems, ...tickerItems].map((op, i) => (
                    <a 
                        key={i} 
                        href={op.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleTickerClick(e, op.url)}
                        className={`flex items-center gap-6 border-r border-white/10 pr-16 h-8 no-underline ${isLoggedIn ? 'cursor-pointer group/ticker' : 'cursor-default opacity-80'}`}
                    >
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                            op.type === 'CRITICAL' ? 'bg-red-500/10 border-red-500 text-red-500' : 
                            op.type === 'HOT' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 
                            'bg-primary/10 border-primary text-primary'
                        }`}>
                            {op.type}
                        </span>
                        <span className={`text-[11px] font-bold text-white uppercase tracking-tight ${isLoggedIn ? 'group-hover/ticker:text-primary transition-colors' : ''}`}>{op.label}</span>
                        <span className="text-[11px] font-black text-emerald-400 tabular-nums">{op.amount}</span>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Clock size={12} className="opacity-50" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{op.time}</span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default AlphaTicker;
