from fastapi import APIRouter
from typing import Optional
from services.dynamodb_service import list_markets_by_platform

router = APIRouter()

# Mock initial markets for testing/simulation
MOCK_MARKETS = [
    {"market_id": "polymarket_1", "platform": "Polymarket", "title": "Will Bitcoin break $100k by year end?", "probability": 0.65, "volume": 1200000},
    {"market_id": "polymarket_2", "platform": "Polymarket", "title": "Who will win the election?", "probability": 0.51, "volume": 5500000},
    {"market_id": "kalshi_1", "platform": "Kalshi", "title": "Will CPI be above 3.5% next month?", "probability": 0.42, "volume": 850000},
    {"market_id": "manifold_1", "platform": "Manifold", "title": "LK-99 Replication Confirmed by 2025?", "probability": 0.15, "volume": 320000},
]

@router.get("/")
def get_markets(platform: Optional[str] = None):
    # Depending on DB size, we would fetch from dynamo here:
    # return list_markets_by_platform(platform)
    
    # Returning mocked robust market data for simulator frontend
    markets = MOCK_MARKETS
    if platform:
        markets = [m for m in MOCK_MARKETS if m["platform"].lower() == platform.lower()]
    return {"markets": markets}

@router.get("/leaderboard")
def get_leaderboard(limit: int = 10):
    from services.polymarket_service import polymarket_service
    leaderboard = polymarket_service.get_leaderboard(limit=limit)
    return {"leaderboard": leaderboard}

@router.get("/categories")
def get_categories(platform: Optional[str] = "Polymarket"):
    if platform.lower() == "polymarket":
        from services.polymarket_service import polymarket_service
        return {"categories": polymarket_service.get_all_categories()}
    return {"categories": []}

@router.get("/{market_id}")
def get_market(market_id: str):
    for m in MOCK_MARKETS:
        if m["market_id"] == market_id:
            return {"market": m}
    return {"market": None}

@router.get("/ticker/signals")
def get_ticker_signals():
    from services.polymarket_service import polymarket_service
    signals = polymarket_service.get_ticker_signals()
    return {"signals": signals}
