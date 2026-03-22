import React, { useContext } from 'react';
import { Clock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const AlphaTicker = ({ variant = 'default' }) => {
    const { user } = useContext(AuthContext);
    const isLoggedIn = !!user;

    const opportunities = [
        { 
            label: "US Election Whale Activity", 
            amount: "$124,500", 
            time: "2m left", 
            type: "CRITICAL",
            url: "https://polymarket.com/event/presidential-election-winner-2024"
        },
        { 
            label: "Crypto Sentiment Spike", 
            amount: "+$4.2k Potential", 
            time: "8m left", 
            type: "HOT",
            url: "https://polymarket.com/event/bitcoin-price-range-at-end-of-month"
        },
        { 
            label: "OracleWhale just entered YES", 
            amount: "$18,000", 
            time: "Just now", 
            type: "WHALE",
            url: "https://polymarket.com/event/will-eth-hit-4000-in-2024"
        },
        { 
            label: "New Alpha Signal: BTC ETF", 
            amount: "94% Conf", 
            time: "15m left", 
            type: "SIGNAL",
            url: "https://polymarket.com/event/will-the-sec-approve-a-spot-bitcoin-etf-by-december-31"
        }
    ];

    const handleTickerClick = (url) => {
        if (isLoggedIn) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            // Optional: Show a subtle hint or do nothing as per user instruction "work only when user is logged in"
            console.log("Navigation restricted to authenticated users.");
        }
    };

    if (variant === 'mini') {
        return (
            <div className="w-full bg-primary/10 border-b border-primary/20 h-10 flex items-center overflow-hidden whitespace-nowrap relative z-[60]">
                <div className="absolute left-0 z-20 h-full flex items-center px-4 bg-primary text-[8px] font-black uppercase tracking-[0.2em] text-white">
                    LIVE ALPHA
                </div>
                <div className="flex gap-12 animate-marquee">
                    {[...opportunities, ...opportunities].map((op, i) => (
                        <div 
                            key={i} 
                            onClick={() => handleTickerClick(op.url)}
                            className={`flex items-center gap-4 text-[10px] font-bold ${isLoggedIn ? 'cursor-pointer hover:text-white transition-colors' : 'cursor-default'}`}
                        >
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border ${
                                op.type === 'CRITICAL' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-primary/20 border-primary/40 text-primary'
                            }`}>{op.type}</span>
                            <span className="text-white/60 uppercase">{op.label}</span>
                            <span className="text-emerald-400 font-black tracking-tighter">{op.amount}</span>
                            <span className="text-white/30 font-black tracking-tighter uppercase">{op.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="relative mb-10 h-12 rounded-2xl border border-primary/30 bg-primary/5 shadow-inner overflow-hidden flex items-center">
            <div className="absolute left-0 z-20 h-full flex items-center px-6 bg-primary text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl">
                LIVE ALPHA
            </div>
            <div className="flex gap-16 py-2 animate-marquee whitespace-nowrap pl-40">
                {[...opportunities, ...opportunities, ...opportunities].map((op, i) => (
                    <div 
                        key={i} 
                        onClick={() => handleTickerClick(op.url)}
                        className={`flex items-center gap-6 border-r border-white/10 pr-16 h-8 ${isLoggedIn ? 'cursor-pointer group/ticker' : 'cursor-default'}`}
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
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlphaTicker;
