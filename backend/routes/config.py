from fastapi import APIRouter
from services.dynamodb_service import get_system_config, get_subscription_tiers

router = APIRouter()

@router.get("/defaults")
def get_defaults():
    """Returns global system defaults fetched from DynamoDB."""
    config = get_system_config()
    return {
        "default_capital": config.get("default_capital", 50000),
        "default_slots": config.get("default_slots", 10),
        "default_tier_id": config.get("default_tier_id", "pro")
    }

@router.get("/plans")
def get_plans():
    """Returns all available subscription tiers/plans."""
    tiers = get_subscription_tiers()
    # Format for frontend if necessary, or just return as is
    return {"plans": tiers}
