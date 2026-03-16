from fastapi import APIRouter

router = APIRouter()

MOCK_SIGNALS = [
    {
        "signal_id": "sig_1",
        "type": "consensus",
        "market_id": "polymarket_1",
        "market_title": "Will Bitcoin break $100k by year end?",
        "message": "Strong BUY consensus: 5 high-accuracy traders bet YES in the last hour.",
        "timestamp": "2024-05-20T10:00:00Z",
        "severity": "high"
    },
    {
        "signal_id": "sig_2",
        "type": "whale_alert",
        "market_id": "polymarket_2",
        "market_title": "Who will win the election?",
        "message": "Whale Bet Alert: $500k placed on YES by OracleWhale, shifting odds by 4%.",
        "timestamp": "2024-05-20T11:30:00Z",
        "severity": "critical"
    },
     {
        "signal_id": "sig_3",
        "type": "manipulation",
        "market_id": "manifold_1",
        "market_title": "LK-99 Replication Confirmed by 2025?",
        "message": "Unusual price move vs liquidity detected. Potential manipulation.",
        "timestamp": "2024-05-20T12:15:00Z",
        "severity": "warning"
    }
]

@router.get("/")
def get_recent_signals():
    return {"signals": MOCK_SIGNALS}
