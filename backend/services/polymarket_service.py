import requests
from typing import Dict, Any, List, Optional
import os
import time
from datetime import datetime
from dotenv import load_dotenv
import boto3

# Load environment variables for local development
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.development"))
from services.metrics_engine import MetricsEngine, TagEngine

class PolymarketService:
    def __init__(self):
        self.base_url = "https://clob.polymarket.com" # Example Gamma CLOB API
        self._stats_cache = {} # address -> {stats, expiry}
        
        # DynamoDB for daily snapshots
        region = os.getenv('AWS_REGION', 'ap-south-1')
        endpoint = os.getenv('DYNAMODB_ENDPOINT')
        kwargs = {'region_name': region}
        if endpoint:
            kwargs['endpoint_url'] = endpoint
            print(f"[PolymarketService] Using local endpoint: {endpoint}")
            
        self.db = boto3.resource('dynamodb', **kwargs)
        self.table_name = os.getenv('LEADERBOARD_TABLE')

    def _get_db_snapshot(self, date_str: str, timeframe: str) -> Optional[List[Dict[str, Any]]]:
        """Retrieve a leaderboard snapshot from DynamoDB if it exists."""
        if not self.table_name:
            return None
        try:
            table = self.db.Table(self.table_name)
            res = table.get_item(Key={'snapshot_date': date_str, 'timeframe': timeframe})
            if 'Item' in res:
                # DynamoDB stores numbers as Decimals, we convert back to floats/ints
                import json
                from decimal import Decimal
                
                class DecimalEncoder(json.JSONEncoder):
                    def default(self, obj):
                        if isinstance(obj, Decimal): return float(obj)
                        return super(DecimalEncoder, self).default(obj)
                
                # Simple way to clean Decimals is round-trip through JSON or recursive conversion
                # For simplicity here, we'll assume the client handles it or we convert now
                def clean_decimals(obj):
                    if isinstance(obj, list): return [clean_decimals(i) for i in obj]
                    if isinstance(obj, dict): return {k: clean_decimals(v) for k, v in obj.items()}
                    if isinstance(obj, Decimal): return float(obj)
                    return obj
                
                return clean_decimals(res['Item'].get('traders', []))
        except Exception as e:
            print(f"Error reading from DynamoDB: {e}")
        return None

    def _save_db_snapshot(self, date_str: str, timeframe: str, traders: List[Dict[str, Any]]):
        """Save a leaderboard snapshot to DynamoDB."""
        if not self.table_name:
            return
        try:
            table = self.db.Table(self.table_name)
            # Convert floats to Decimals for DynamoDB
            from decimal import Decimal
            def to_decimal(obj):
                if isinstance(obj, list): return [to_decimal(i) for i in obj]
                if isinstance(obj, dict): return {k: to_decimal(v) for k, v in obj.items()}
                if isinstance(obj, float): return Decimal(str(round(obj, 6)))
                return obj
            
            table.put_item(Item={
                'snapshot_date': date_str,
                'timeframe': timeframe,
                'traders': to_decimal(traders),
                'created_at': datetime.utcnow().isoformat()
            })
        except Exception as e:
            print(f"Error saving to DynamoDB: {e}")

    def get_trader_stats(self, address: str) -> Dict[str, Any]:
        """Fetch deep stats (wins, drawdown, history) for a trader."""
        # 1. Simple Cache Check
        now = time.time()
        if address in self._stats_cache:
            cache_entry = self._stats_cache[address]
            if now < cache_entry["expiry"]:
                return cache_entry["stats"]

        try:
            # 2. Fetch positions for deep enrichment
            res = requests.get(f"https://data-api.polymarket.com/positions?user={address}")
            if not res.ok:
                return {}
            
            positions = res.json()
            if not positions:
                return {}
            
            # Sort positions by date if possible (eventId/timestamp proxy)
            # For simplicity, we'll treat them as a series
            total_trades = len(positions)
            
            def safe_float(v):
                try: return float(v) if v is not None else 0.0
                except: return 0.0

            wins = len([p for p in positions if safe_float(p.get("cashPnl")) > 0])
            win_rate = wins / max(1, total_trades)
            
            pnl_history = [safe_float(p.get("cashPnl")) for p in positions]
            avg_bet_size = sum([safe_float(p.get("totalBought")) for p in positions]) / max(1, total_trades)
            
            # Drawdown Calculation (Cumulative Min vs Peak)
            cum_pnl = 0.0
            peak = 0.0
            max_drawdown = 0.0
            history = []
            for pnl in pnl_history:
                cum_pnl += pnl
                history.append(cum_pnl)
                if cum_pnl > peak:
                    peak = cum_pnl
                
                # Safe divide to avoid zero peak division
                if peak > 0:
                    dd = (peak - cum_pnl) / peak
                else:
                    dd = 0.0
                
                if dd > max_drawdown:
                    max_drawdown = dd
            
            stats = {
                "total_trades": total_trades,
                "wins": wins,
                "win_rate": win_rate,
                "pnl_history": history[-15:], # Last 15 data points for sparkline
                "avg_bet_size": avg_bet_size,
                "max_drawdown": max_drawdown,
                "consistency_score": min(1.0, 1.0 - (max_drawdown * 2.0)) if total_trades > 5 else 0.5
            }
            
            # Cache for 10 minutes
            self._stats_cache[address] = {"stats": stats, "expiry": now + 600}
            return stats
        except Exception as e:
            print(f"Error fetching trader stats for {address}: {e}")
            return {}

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
        """Fetch leaderboard for a specific timeframe and metric (PNL, ROI, WIN_RATE, SCORE)."""
        try:
            period = timeframe.upper()
            if period == "TODAY" or period == "ALL": period = "DAY" # Data API quirk
            if period == "WEEKLY": period = "WEEK"
            if period == "MONTHLY": period = "MONTH"
            
            # 1. Check DynamoDB Cache First (Daily persistence)
            today_str = datetime.utcnow().strftime('%Y-%m-%d')
            cached_traders = self._get_db_snapshot(today_str, period)
            if cached_traders:
                # Return cached data after sorting by requested metric
                return self._sort_leaderboard(cached_traders, sort_by)[:limit]

            # 2. Fetch from Live API if not cached or new day
            api_order_by = "PNL"
            if sort_by.upper() == "VOL": api_order_by = "VOL"

            res = requests.get(f"https://data-api.polymarket.com/v1/leaderboard?timePeriod={period}&limit=50&orderBy={api_order_by}")
            if res.ok:
                raw_traders = res.json()
                processed_traders = []
                
                # Enrich only the top N for performance/latency reasons
                # We enrich 40 to have a good pool for sorting
                for t in raw_traders[:40]: 
                    pnl = float(t.get("pnl", 0))
                    vol = float(t.get("vol", 1))
                    address = t.get("proxyWallet")
                    
                    # Fetch deep stats
                    deep_stats = self.get_trader_stats(address)
                    
                    # Compute Production Metrics
                    max_dd = deep_stats.get("max_drawdown", 0.1)
                    avg_bet = deep_stats.get("avg_bet_size", 500)
                    win_rate = deep_stats.get("win_rate", 0.5)
                    consistency = deep_stats.get("consistency_score", 0.5)
                    
                    adj_roi = MetricsEngine.calculate_adjusted_roi(pnl, vol, max_dd)
                    risk_score = MetricsEngine.calculate_risk_score(max_dd, avg_bet, vol)
                    whale_score = MetricsEngine.calculate_whale_score(
                        adj_roi, win_rate, vol, consistency, max_dd
                    )
                    
                    # Calculate ROI and cap extreme outliers for a premium UI feel
                    raw_roi = (pnl / max(1.0, vol)) * 100.0
                    adj_roi_val = adj_roi * 100.0
                    
                    roi_val = min(999.9, max(-999.9, raw_roi))
                    adj_roi_val = min(999.9, max(-999.9, adj_roi_val))
                    
                    p_trader = {
                        "rank": t.get("rank"),
                        "username": t.get("userName") or t.get("pseudonym") or "Anonymous Whale",
                        "address": address,
                        "pnl": pnl,
                        "volume": vol,
                        "roi": roi_val,
                        "adjusted_roi": adj_roi_val,
                        "win_rate": win_rate,
                        "total_trades": deep_stats.get("total_trades", 0),
                        "risk_score": risk_score,
                        "whale_score": whale_score,
                        "pnl_history": deep_stats.get("pnl_history", []),
                        "profile_image": t.get("profileImage"),
                    }
                    
                    # Assign Tags
                    p_trader["tags"] = TagEngine.assign_tags({**p_trader, **deep_stats})
                    processed_traders.append(p_trader)
                
                # 3. Save to DynamoDB for persistent daily view
                self._save_db_snapshot(today_str, period, processed_traders)
                
                return self._sort_leaderboard(processed_traders, sort_by)[:limit]
        except Exception as e:
            print(f"Error fetching leaderboard: {e}")
            return []

    def calculate_global_rank(self, user_roi: float, timeframe: str = "DAY") -> int:
        """Estimate global rank based on user ROI vs cached leaderboard snapshots."""
        try:
            today_str = datetime.utcnow().strftime('%Y-%m-%d')
            cached_traders = self._get_db_snapshot(today_str, timeframe.upper())
            
            if not cached_traders:
                # Fallback: Mocked rank if no data available yet
                # Assumes 10,000 users, rank calculated by ROI relative to a typical distribution
                if user_roi <= 0: return 1284 # Placeholder-like fallback
                mock_rank = max(1, int(1000 / max(1, user_roi)))
                return mock_rank

            # Sort and find position
            # Adjusted ROI is what we usually show on leaderboard
            rois = sorted([t.get("roi", 0) for t in cached_traders], reverse=True)
            
            # Simple percentile-based extrapolation
            # If we have top 50, and user is among them, we give exact rank
            for i, roi in enumerate(rois):
                if user_roi >= roi:
                    return i + 1
            
            # If below top 50, extrapolate based on last ROI
            # Let's assume a total population of 5000 tracked users
            # if Rank 50 has 10% ROI and User has 2%, they are around Rank 250
            last_roi = rois[-1] if rois else 1.0
            if user_roi <= 0: return 1500 + int(abs(user_roi) * 10)
            
            extrapolated_rank = 50 + int((last_roi - user_roi) * 100)
            return max(51, extrapolated_rank)
            
        except Exception as e:
            print(f"Error calculating global rank: {e}")
            return 1284

    def _sort_leaderboard(self, traders: List[Dict[str, Any]], sort_by: str) -> List[Dict[str, Any]]:
        """Helper to sort the leaderboard in-memory."""
        if sort_by.upper() == "ROI":
            traders.sort(key=lambda x: x["roi"], reverse=True)
        elif sort_by.upper() == "ADJUSTED_ROI":
            traders.sort(key=lambda x: x["adjusted_roi"], reverse=True)
        elif sort_by.upper() == "WIN_RATE":
            traders.sort(key=lambda x: x["win_rate"], reverse=True)
        elif sort_by.upper() == "SCORE" or sort_by.upper() == "WHALE_SCORE":
            traders.sort(key=lambda x: x["whale_score"], reverse=True)
        else: # Default PNL
            traders.sort(key=lambda x: x["pnl"], reverse=True)
        return traders

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
