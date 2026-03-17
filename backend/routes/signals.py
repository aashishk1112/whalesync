from fastapi import APIRouter
from datetime import datetime
from services.dynamodb_service import get_latest_ai_analysis

router = APIRouter()

@router.get("/")
async def get_recent_signals():
    """
    Returns AI-generated consensus signals from the latest background analysis job.
    """
    # Standardized: Type=SIGNALS, ID=GLOBAL_POLYMARKET
    cached = get_latest_ai_analysis("SIGNALS", "GLOBAL_POLYMARKET")
    if not cached:
        return {"signals": [], "status": "analyzing"}
        
    signals = cached.get("data", [])
    
    # Format for frontend
    formatted = []
    for s in signals:
        formatted.append({
            "signal_id": f"ai_{s['market_id']}",
            "type": "consensus",
            "market_id": s["market_id"],
            "market_title": s["title"],
            "message": f"AI Consensus: {int(s['confidence'] * 100)}% conviction among top traders. Recommended action: {s['signal']}.",
            "timestamp": s["timestamp"],
            "severity": "high" if s["confidence"] > 0.75 else "medium",
            "reasoning": s["reasoning"]
        })
        
    return {"signals": formatted, "updated_at": cached.get("updated_at")}
