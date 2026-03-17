from typing import List, Dict, Any
import math

class ScoringService:
    @staticmethod
    def calculate_score(trader_data: Dict[str, Any]) -> float:
        """
        Calculates a performance score based on the WhaleSync v2 formula:
        score = (0.4 * ROI) + (0.2 * win_rate) + (0.2 * sharpe_ratio) + (0.2 * consistency)
        
        All metrics should be normalized or scaled appropriately.
        """
        roi = float(trader_data.get("roi", 0))
        win_rate = float(trader_data.get("win_rate", 0))
        sharpe_ratio = float(trader_data.get("sharpe_ratio", 0))
        consistency = float(trader_data.get("consistency", 0))

        # Scaling and normalization logic
        # For this implementation, we assume metrics are pre-normalized to 0-100 where possible,
        # or we apply simple scaling.
        
        weighted_score = (
            (0.4 * roi) + 
            (0.2 * (win_rate * 100)) + # Assuming win_rate is 0.0 - 1.0
            (0.2 * (sharpe_ratio * 10)) + # Assuming sharpe is usually 0-5, scale to 0-50
            (0.2 * consistency)
        )
        
        return float(f"{weighted_score:.2f}")

    def rank_traders(self, traders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Takes a list of raw trader data and returns them with calculated scores and ranks.
        """
        processed = []
        for trader in traders:
            # Heuristic derivation if direct metrics are missing
            if "pnl" in trader and "roi" not in trader:
                # Mock ROI based on PnL for demonstration
                pnl = float(trader.get("pnl", 0))
                trader["roi"] = min(pnl / 100, 100) # Simple cap
                trader["win_rate"] = 0.6 + (pnl % 10) / 100 # Mock win rate
                trader["sharpe_ratio"] = 1.5 + (pnl % 5) / 10 # Mock sharpe
                trader["consistency"] = 70 + (pnl % 30) # Mock consistency

            score = self.calculate_score(trader)
            trader["ai_score"] = score
            processed.append(trader)
            
        # Sort by score descending
        processed.sort(key=lambda x: x.get("ai_score", 0), reverse=True)
        
        # Add rank
        for i, trader in enumerate(processed):
            trader["ai_rank"] = i + 1
            
        return processed

scoring_service = ScoringService()
