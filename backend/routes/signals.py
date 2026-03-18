from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, timezone
from services.dynamodb_service import get_user_by_id, get_subscription_tier

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
def get_recent_signals(user_id: str):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    tier = user.get("subscription_tier", "free")
    tier_config = get_subscription_tier(tier)
    
    delay_mins = tier_config.get("signal_delay_mins", 0)
    has_whale_alerts = tier_config.get("whale_alerts", False)
    
    now = datetime.now(timezone.utc)
    filtered_signals = []
    
    for sig in MOCK_SIGNALS:
        # 1. Access Check: Whale alerts only for Elite
        if sig["type"] == "whale_alert" and not has_whale_alerts:
            continue
            
        # 2. Delay Logic
        sig_time = datetime.fromisoformat(sig["timestamp"].replace("Z", "+00:00"))
        if now - sig_time < timedelta(minutes=delay_mins):
            continue
            
        filtered_signals.append(sig)
        
    return {"signals": filtered_signals, "tier": tier, "delay_mins": delay_mins}
