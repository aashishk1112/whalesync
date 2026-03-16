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
def get_leaderboard(timeframe: str = "DAY"):
    from services.polymarket_service import polymarket_service
    traders = polymarket_service.get_leaderboard(timeframe=timeframe)
    return {"traders": traders}

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
