from typing import List, Dict, Any
import numpy as np

class MetricsEngine:
    @staticmethod
    def calculate_adjusted_roi(pnl: float, volume: float, max_drawdown: float) -> float:
        """
        Calculates adjusted ROI with volume smoothing to prevent unrealistic values for low-volume traders.
        roi = pnl / (volume + smoothing_factor)
        """
        smoothing_factor = 5000.0 # $5k buffer to dampen low-volume outliers
        if volume < 0: # Should not happen, but for safety
            return 0.0
            
        roi = pnl / (volume + smoothing_factor)
        # Further adjust by drawdown to reward risk management
        adj_roi = max(roi - (max_drawdown * 0.2), 0.0) 
        return float(adj_roi)

    @staticmethod
    def calculate_risk_score(max_drawdown: float, avg_bet_size: float, volume: float) -> float:
        """risk_score = min(1, (max_drawdown * 0.7 + (avg_bet_size/volume_proxy) * 0.3))"""
        # avg_bet_size relative to total volume for risk context
        volume_proxy = max(100.0, volume)
        relative_bet_size = min(1.0, avg_bet_size / volume_proxy)
        score = (max_drawdown * 0.7) + (relative_bet_size * 0.3)
        return float(min(1.0, max(0.0, score)))

    @staticmethod
    def calculate_whale_score(
        adjusted_roi: float, 
        win_rate: float, 
        volume: float, 
        consistency_score: float, 
        max_drawdown: float
    ) -> float:
        """
        whale_score = (
            adjusted_roi * 0.3 +
            win_rate * 0.2 +
            volume_score * 0.2 +
            consistency_score * 0.2 +
            (1 - max_drawdown) * 0.1
        ) * 100
        """
        # Normalize volume for scoring (log scale for whales)
        volume_score = min(1.0, np.log10(max(1.0, volume)) / 7.0) # 10M = 1.0
        
        # Increased weights for ROI and Win Rate to better differentiate top traders
        score = (
            min(0.25, adjusted_roi) / 0.25 * 0.4 + # Scaled: 25% ROI = 0.4 contribution
            win_rate * 0.25 +
            volume_score * 0.15 +
            consistency_score * 0.1 +
            (1.0 - max_drawdown) * 0.1
        )
        return float(min(100.0, max(0.0, score * 100.0)))

class TagEngine:
    @staticmethod
    def assign_tags(trader: Dict[str, Any]) -> List[str]:
        tags = []
        avg_bet = trader.get("avg_bet_size", 0)
        total_trades = trader.get("total_trades", 0)
        win_rate = trader.get("win_rate", 0)
        pnl_history = trader.get("pnl_history", [])
        
        # Whale: Large average bet size
        if avg_bet > 10000:
            tags.append("whale")
        
        # Scalper: High frequency
        if total_trades > 50:
            tags.append("scalper")
        
        # Sniper: High precision, lower frequency
        if win_rate > 0.75 and total_trades < 20:
            tags.append("sniper")
            
        # Momentum: Increasing PNL trend
        if len(pnl_history) >= 5:
            recent = pnl_history[-3:]
            older = pnl_history[-5:-2]
            if sum(recent) > sum(older):
                tags.append("momentum")
                
        return tags
