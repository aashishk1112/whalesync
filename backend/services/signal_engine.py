from typing import List, Dict, Any
from datetime import datetime
from services.polymarket_service import polymarket_service
from services.scoring_service import scoring_service

class SignalEngine:
    def __init__(self):
        self.min_confidence = 0.6
        self.top_trader_count = 10

    async def generate_consensus_signals(self) -> List[Dict[str, Any]]:
        """
        1. Fetch top traders from Polymarket
        2. Score them using ScoringService
        3. Fetch their recent activity
        4. Aggregate positions to find consensus
        5. Return structured signals
        """
        # Step 1: Get raw leaderboard
        raw_traders = polymarket_service.get_leaderboard(timeframe="DAY", limit=20)
        
        # Step 2: Score and rank
        top_traders = scoring_service.rank_traders(raw_traders)[:self.top_trader_count]
        
        market_consensus = {} # market_id -> { "YES": count, "NO": count, "total_weight": float }

        # Step 3: Analyze activity
        for trader in top_traders:
            address = trader.get("proxyWallet")
            weight = trader.get("ai_score", 50) / 100.0 # Weight by AI score
            
            activity = polymarket_service.get_trader_activity(address)
            for trade in activity:
                market_id = trade.get("marketConditionId")
                side = trade.get("side") # "BUY" or "SELL"
                # For simplicity, assume consensus on the market's primary outcome
                
                if market_id not in market_consensus:
                    market_consensus[market_id] = { "BUY": 0.0, "SELL": 0.0, "weight": 0.0 }
                
                # side could be "BUY" or "SELL", ensure it exists in the dict
                stats = market_consensus[market_id]
                if side in ["BUY", "SELL"]:
                    stats[side] += weight
                    stats["weight"] += weight

        # Step 4: Generate signals
        signals = []
        for market_id, stats in market_consensus.items():
            total_w = float(stats["weight"])
            if total_w == 0: continue
            
            buy_ratio = float(stats["BUY"]) / total_w
            sell_ratio = float(stats["SELL"]) / total_w
            
            if buy_ratio > self.min_confidence or sell_ratio > self.min_confidence:
                action = "BUY" if buy_ratio > sell_ratio else "SELL"
                confidence = max(buy_ratio, sell_ratio)
                
                # Fetch basic market details for the signal
                market_info = polymarket_service.get_market_details(str(market_id))
                
                signals.append({
                    "market_id": market_id,
                    "title": market_info.get("question", "Unknown Market"),
                    "signal": action,
                    "confidence": float(f"{confidence:.2f}"),
                    "timestamp": datetime.now().isoformat(),
                    "platform": "Polymarket",
                    "reasoning": f"Consensus among {self.top_trader_count} top-ranked traders."
                })

        # Sort by confidence
        signals.sort(key=lambda x: x["confidence"], reverse=True)
        return signals

signal_engine = SignalEngine()
