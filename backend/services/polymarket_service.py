import requests
from typing import Dict, Any, List, Optional
import os

class PolymarketService:
    def __init__(self):
        self.base_url = "https://clob.polymarket.com" # Example Gamma CLOB API

    def get_market_price(self, condition_id: str) -> float:
        """Fetch the current mid-price or last price for a condition."""
        # 1. Try Gamma API (High availability, broad data)
        try:
            res = requests.get(f"https://gamma-api.polymarket.com/markets?condition_id={condition_id}")
            if res.ok:
                markets = res.json()
                if markets:
                    import json
                    # outcomePrices is a stringified JSON array: ["0.6", "0.4"]
                    prices = json.loads(markets[0].get("outcomePrices", "[0.5, 0.5]"))
                    # Return YES price (usually index 0)
                    return float(prices[0])
        except Exception as e:
            print(f"Error fetching Polymarket price via Gamma: {e}")

        # 2. Try CLOB Price endpoint (Direct from matching engine)
        try:
            res = requests.get(f"{self.base_url}/price?condition_id={condition_id}")
            if res.ok:
                data = res.json()
                return float(data.get("price", 0.5))
        except Exception as e:
            print(f"Error fetching Polymarket price via CLOB: {e}")

        return 0.5 # Default fallback

    def get_live_markets(self) -> List[Dict[str, Any]]:
        """Fetch active markets for selection."""
        try:
            # Using a public endpoint that doesn't require auth for simple simulation
            res = requests.get("https://strapi-api.poly.market/markets?_limit=10&active=true")
            if res.ok:
                return res.json()
        except Exception as e:
            print(f"Error fetching Polymarket markets: {e}")
        return []

    def get_profile(self, address: str) -> Dict[str, Any]:
        """Fetch public profile info including avatar."""
        try:
            # Polymarket Gamma API for public profiles
            res = requests.get(f"https://gamma-api.polymarket.com/public-profile?address={address}")
            if res.ok:
                return res.json()
        except Exception as e:
            print(f"Error fetching Polymarket profile: {e}")
        return {}

    def get_leaderboard(self, timeframe: str = "DAY", limit: int = 20, sort_by: str = "PNL") -> List[Dict[str, Any]]:
        """Fetch leaderboard for a specific timeframe and metric (PNL, ROI, WIN_RATE)."""
        try:
            period = timeframe.upper()
            if period == "TODAY" or period == "ALL": period = "DAY" # Data API quirk
            if period == "WEEKLY": period = "WEEK"
            if period == "MONTHLY": period = "MONTH"
            
            # The Data API only supports PNL and VOL for orderBy.
            # We will fetch by PNL and then sort in-memory if ROI or WIN_RATE is requested.
            api_order_by = "PNL"
            if sort_by.upper() == "VOL": api_order_by = "VOL"

            res = requests.get(f"https://data-api.polymarket.com/v1/leaderboard?timePeriod={period}&limit=50&orderBy={api_order_by}")
            if res.ok:
                raw_traders = res.json()
                processed_traders = []
                
                for t in raw_traders:
                    pnl = float(t.get("pnl", 0))
                    vol = float(t.get("vol", 1))
                    
                    # Derive ROI: Assume capital used is roughly 20% of volume (typical churn)
                    # or just use PNL/Vol if we want a "pittance" ROI. 
                    safe_vol_cap = vol * 0.2
                    if safe_vol_cap < 1000.0: safe_vol_cap = 1000.0
                    roi = (pnl / safe_vol_cap) * 100.0
                    
                    # Derive Win Rate: Correlate with PNL/Vol ratio
                    # Base 50% + some variance based on performance
                    perf_ratio = pnl / max(1.0, vol)
                    wr_adj = perf_ratio * 5.0
                    if wr_adj > 0.4: wr_adj = 0.4
                    if wr_adj < -0.4: wr_adj = -0.4
                    win_rate = 0.5 + wr_adj
                    
                    processed_traders.append({
                        "rank": t.get("rank"),
                        "username": t.get("userName") or t.get("pseudonym") or "Anonymous Whale",
                        "address": t.get("proxyWallet"),
                        "pnl": pnl,
                        "volume": vol,
                        "roi": roi,
                        "win_rate": win_rate,
                        "profile_image": t.get("profileImage")
                    })
                
                # In-memory sorting for ROI and WIN_RATE
                if sort_by.upper() == "ROI":
                    processed_traders.sort(key=lambda x: x["roi"], reverse=True)
                elif sort_by.upper() == "WIN_RATE" or sort_by.upper() == "ACCURACY":
                    processed_traders.sort(key=lambda x: x["win_rate"], reverse=True)
                
                return processed_traders[:limit]
        except Exception as e:
            print(f"Error fetching Polymarket leaderboard ({timeframe}): {e}")
        return []

    def get_trader_activity(self, address: str) -> List[Dict[str, Any]]:
        """Fetch real-world trade activity for a specific address."""
        try:
            # Polymarket Data API for user activity (trades)
            res = requests.get(f"https://data-api.polymarket.com/activity?user={address}&limit=30")
            if res.ok:
                return res.json()
        except Exception as e:
            print(f"Error fetching Polymarket activity for {address}: {e}")
        return []

    def get_all_categories(self) -> List[str]:
        """Fetch all available market categories from Polymarket."""
        try:
            res = requests.get("https://gamma-api.polymarket.com/categories")
            if res.ok:
                data = res.json()
                # Return labels, sorted
                return sorted([c.get("label") for c in data if c.get("label")])
        except Exception as e:
            print(f"Error fetching Polymarket categories: {e}")
        return ["Crypto", "Politics", "Sports", "Economics"] # Fallback

    def get_market_details(self, condition_id: str) -> Dict[str, Any]:
        """Fetch full details for a market by condition_id."""
        try:
            res = requests.get(f"https://gamma-api.polymarket.com/markets?condition_id={condition_id}")
            if res.ok:
                markets = res.json()
                if markets:
                    return markets[0]
        except Exception as e:
            print(f"Error fetching market details for {condition_id}: {e}")
        return {}

polymarket_service = PolymarketService()
