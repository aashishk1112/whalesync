from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.stripe_service import create_subscription_session
from services.dynamodb_service import get_user_by_id

router = APIRouter()

class SubscriptionRequest(BaseModel):
    tier: str

@router.post("/create-session")
def create_session(data: SubscriptionRequest, user_id: str):
    """Creates a Stripe Checkout Session for the selected tier."""
    if data.tier not in ["pro", "elite"]:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    checkout_url = create_subscription_session(user_id, data.tier)
    if not checkout_url:
        raise HTTPException(status_code=500, detail="Failed to create checkout session")
    
    return {"checkout_url": checkout_url}

@router.get("/status")
def get_status(user_id: str):
    """Returns the current subscription status of the user."""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "tier": user.get("subscription_tier", "pro"),
        "slots": user.get("source_slots", 10)
    }
