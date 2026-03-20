from fastapi import APIRouter

router = APIRouter()

# Mocked Leaderboard
MOCK_TRADERS = [
    {"trader_id": "T1", "username": "OracleWhale", "accuracy": 0.89, "roi": 145.2, "volume": 5000000},
    {"trader_id": "T2", "username": "PredictionBot3000", "accuracy": 0.82, "roi": 95.5, "volume": 1200000},
    {"trader_id": "T3", "username": "KalshiKing", "accuracy": 0.76, "roi": 42.1, "volume": 600000},
    {"trader_id": "T4", "username": "ManifoldMage", "accuracy": 0.71, "roi": 25.8, "volume": 350000},
]

@router.get("/leaderboard")
def get_leaderboard(timeframe: str = "DAY", sort_by: str = "PNL"):
    from services.polymarket_service import polymarket_service
    traders = polymarket_service.get_leaderboard(timeframe=timeframe, sort_by=sort_by)
    return {"traders": traders}

@router.get("/archetypes")
def get_archetypes():
    from services.polymarket_service import polymarket_service
    # Fetch top 50 for a broad pool
    traders = polymarket_service.get_leaderboard(timeframe="DAY", limit=50, sort_by="WHALE_SCORE")
    
    if not traders:
        return {"archetypes": {}}
        
    # 1. 🏆 Top Whale (Already sorted by Whale Score)
    top_whale = traders[0]
    
    # 2. 📈 Best Risk-Adjusted (Highest Adjusted ROI)
    risk_adj = sorted(traders, key=lambda x: x.get("adjusted_roi", 0), reverse=True)[0]
    
    # 3. 🛡 Safest Profitable (Lowest Risk Score with positive ROI)
    profitable = [t for t in traders if t.get("roi", 0) > 0]
    safest = sorted(profitable if profitable else traders, key=lambda x: x.get("risk_score", 1.0))[0]
    
    # 4. 🔥 Most Copied (Social Proof - using Volume/Trades as proxy + mock count)
    most_copied = sorted(traders, key=lambda x: x.get("volume", 0), reverse=True)[0]
    try:
        rank_val = int(most_copied.get("rank", 1))
    except (ValueError, TypeError):
        rank_val = 1
    most_copied["mock_copiers"] = 1000 + (50 - rank_val) * 10
    
    # 5. ⚡ Trending Now (Highest ROI spike/Momentum)
    trending = sorted(traders, key=lambda x: x.get("roi", 0), reverse=True)[0]
    
    return {
        "archetypes": {
            "top_whale": top_whale,
            "risk_adjusted": risk_adj,
            "safest": safest,
            "most_copied": most_copied,
            "trending": trending
        }
    }

@router.get("/{trader_id}")
def get_trader_profile(trader_id: str):
    trader = next((t for t in MOCK_TRADERS if t["trader_id"] == trader_id), None)
    if not trader:
        return {"error": "Trader not found"}
        
    return {
        "trader": trader,
        "genome": {
            "risk_tolerance": "High",
            "favorite_platform": "Polymarket" if trader_id == "T1" else "Kalshi",
            "recent_win_streak": 5
        },
        "recent_bets": [
            {"market_id": "polymarket_1", "position": "YES", "amount": 10000, "resolved": False},
            {"market_id": "kalshi_1", "position": "NO", "amount": 5000, "resolved": True, "won": True}
        ]
    }
