from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
from typing import List, Dict, Any, Optional
from services.dynamodb_service import (
    get_user_by_id, 
    update_user_capital, 
    add_copy_source, 
    update_copy_source_status,
    delete_copy_source,
    get_user_trades,
    record_trade as db_record_trade,
    link_user_polymarket_address,
    wipe_user_data,
    accept_risk_disclosure,
    perform_aml_screening
)
from services.stripe_service import create_checkout_session

router = APIRouter()

class CopyTradeRequest(BaseModel):
    trader_id: str
    market_id: str
    position: str # YES/NO
    amount: float
    price_odds: float

def self_heal_sources(user_id: str, current_sources: List[Dict]):
    updated = False
    from services.polymarket_service import polymarket_service
    for s in current_sources:
        if s.get("platform") == "Polymarket" and not s.get("image_url"):
            profile = polymarket_service.get_profile(s["address"])
            if profile.get("profileImage"):
                s["image_url"] = profile["profileImage"]
                updated = True
    if updated:
         # Simplified: we just update it in DB if someone calls /me and it's missing
         from services.dynamodb_service import users_table
         users_table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET copy_sources = :s",
            ExpressionAttributeValues={":s": current_sources}
         )

@router.get("/me")
def get_my_portfolio(user_id: str):
    db_user = get_user_by_id(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    from services.polymarket_service import polymarket_service
    
    trades = get_user_trades(user_id)
    open_positions = []
    total_realized_pnl = 0.0
    total_unrealized_pnl = 0.0
    
    market_prices = {} # Cache prices within this request
    
    for t in trades:
        if t.get("status") == "open":
            m_id = t["market_id"]
            if m_id not in market_prices:
                try:
                    market_prices[m_id] = polymarket_service.get_market_price(m_id)
                except:
                    market_prices[m_id] = float(t.get("price", 0.5))
            
            curr_price = market_prices[m_id]
            entry_price = float(t.get("price", 0.5))
            amount = float(t.get("amount", 0))
            
            pnl = 0.0
            if entry_price > 0:
                # Unrealized PnL = (Current - Entry) * (Amount / Entry)
                pnl = (curr_price - entry_price) * (amount / entry_price)
            
            total_unrealized_pnl += pnl
            
            open_positions.append({
                "position_id": t["trade_id"],
                "market_id": t["market_id"],
                "strategy_id": t.get("strategy_id"),
                "side": t["position"],
                "amount_invested": amount,
                "entry_price": entry_price,
                "current_price": curr_price,
                "current_value": round(amount + pnl, 2),
                "unrealized_pnl": round(pnl, 2),
                "created_at": t["created_at"]
            })
        elif t.get("status") == "resolved":
            total_realized_pnl += float(t.get("realized_pnl", 0))
            
    portfolio = {
        "balance": float(db_user.get("simulation_capital", 10000.0)),
        "total_pnl": round(total_realized_pnl + total_unrealized_pnl, 2),
        "total_unrealized_pnl": round(total_unrealized_pnl, 2),
        "open_positions": open_positions
    }
    
    sources = db_user.get("copy_sources", [])
    self_heal_sources(user_id, sources)
    
    
    linked_profile = None
    poly_address = db_user.get("polymarket_address")
    if poly_address:
        try:
             linked_profile = polymarket_service.get_profile(poly_address)
        except:
             pass
             
    return {
        "portfolio": portfolio,
        "settings": {
            "simulation_capital": float(db_user.get("simulation_capital", 10000.0)),
            "source_slots": db_user.get("source_slots", 6),
            "copy_sources": sources,
            "polymarket_address": poly_address,
            "linked_profile": linked_profile
        }
    }

class CapitalUpdate(BaseModel):
    capital: float

@router.post("/settings/capital")
def update_capital(data: CapitalUpdate, user_id: str):
    from services.dynamodb_service import delete_all_user_strategies
    
    # Update capital
    update_user_capital(user_id, data.capital)
    
    # All strategies and trades must be reset as per user request
    delete_all_user_strategies(user_id)
    
    return {"message": "Capital updated and all strategies reset"}

class SourceUpdate(BaseModel):
    platform: str
    address: str
    name: str

@router.post("/copy-sources")
def add_source(source: SourceUpdate, user_id: str):
    db_user = get_user_by_id(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    slots = db_user.get("source_slots", 6)
    current_sources = db_user.get("copy_sources", [])
    
    # Strict Duplicate Check: Platform + Address
    if any(s['platform'] == source.platform and s['address'] == source.address for s in current_sources):
        raise HTTPException(status_code=400, detail=f"This source ({source.address}) is already being followed on {source.platform}.")
    
    # Per-Platform Slot Logic:
    # 1. You get 2 slots per platform for free (Base 6 = 2 Poly + 2 Kalshi + 2 Mani)
    # 2. To follow more than 2 on any SINGLE platform, you must have purchased extra slots.
    
    platform_count = len([s for s in current_sources if s['platform'] == source.platform])
    
    if platform_count >= 2:
        # User wants to follow a 3rd+ person on this platform.
        # Check if they have unused "Extra" slots (extra = total_slots - 6).
        total_extra_capacity = max(0, slots - 6)
        
        # Calculate how many extra slots are ALREADY being used across ALL platforms
        extra_used_total = 0
        platforms = set([s['platform'] for s in current_sources] + [source.platform])
        for p in platforms:
            p_count = len([s for s in current_sources if s['platform'] == p])
            # If we are currently evaluating the platform we are adding to, 
            # we count its current extra usage.
            extra_used_total += max(0, p_count - 2)
            
        if extra_used_total >= total_extra_capacity:
            raise HTTPException(
                status_code=402, 
                detail=f"You have reached the free limit of 2 followings for {source.platform}. Please purchase an additional slot to follow more on this platform."
            )

    # Final safeguard: total capacity
    if len(current_sources) >= slots:
        raise HTTPException(status_code=402, detail="Total subscription limit reached. Please purchase an additional slot.")

    image_url = None
    if source.platform == "Polymarket":
        from services.polymarket_service import polymarket_service
        profile = polymarket_service.get_profile(source.address)
        image_url = profile.get("profileImage")

    source_data = {
        "id": str(uuid.uuid4()),
        "platform": source.platform,
        "address": source.address,
        "name": source.name,
        "active": True,
        "image_url": image_url,
        "added_at": str(uuid.uuid4()) # Placeholder
    }
    
    add_copy_source(user_id, source_data)
    return {"message": "Source added", "source": source_data}

class StatusUpdate(BaseModel):
    active: bool

@router.patch("/copy-sources/{source_id}")
def toggle_source(source_id: str, data: StatusUpdate, user_id: str):
    from services.dynamodb_service import get_user_strategies, get_user_by_id
    
    # Validation: Do not allow pausing/disabling if source is used in an active strategy
    db_user = get_user_by_id(user_id)
    source = next((s for s in db_user.get("copy_sources", []) if s["id"] == source_id), None)
    
    if source and not data.active:
        strategies = get_user_strategies(user_id)
        # Check if any strategy that is not "stopped" uses this address
        in_use = any(source["address"] in s.get("source_addresses", []) and s.get("status") != "stopped" for s in strategies)
        if in_use:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot pause source '{source.get('name')}'. It is currently being used by one or more active simulator strategies."
            )

    success = update_copy_source_status(user_id, source_id, data.active)
    if not success:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"message": "Status updated"}

@router.delete("/copy-sources/{source_id}")
def remove_source(source_id: str, user_id: str):
    from services.dynamodb_service import get_user_strategies, get_user_by_id
    
    db_user = get_user_by_id(user_id)
    source = next((s for s in db_user.get("copy_sources", []) if s["id"] == source_id), None)
    
    if source:
        strategies = get_user_strategies(user_id)
        # Check if ANY strategy (even stopped) uses this address, to be safe
        in_use = any(source["address"] in s.get("source_addresses", []) for s in strategies)
        if in_use:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot terminate source '{source.get('name')}'. It is linked to an existing strategy. Please delete the strategy first."
            )

    success = delete_copy_source(user_id, source_id)
    if not success:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"message": "Source terminated"}

class LinkPolymarketRequest(BaseModel):
    address: str
    creds: Optional[Dict[str, str]] = None

@router.post("/link-polymarket")
def link_polymarket(data: LinkPolymarketRequest, user_id: str):
    # 1. Check if risk disclosure was accepted
    user = get_user_by_id(user_id)
    if not user.get('risk_disclosure_accepted'):
        raise HTTPException(status_code=403, detail="Risk disclosure must be accepted before linking a wallet.")

    # 2. Perform AML Screening
    aml_result = perform_aml_screening(data.address)
    if aml_result["status"] == "flagged":
        raise HTTPException(status_code=403, detail=f"AML Screening Failed: {aml_result['reason']}")

    # Verify address exists on Polymarket
    from services.polymarket_service import polymarket_service
    profile = polymarket_service.get_profile(data.address)
    
    # link_user_polymarket_address now optionally accepts 'creds' (API metadata)
    # ZERO-KNOWLEDGE: Frontend only sends API keys, never private keys.
    link_user_polymarket_address(user_id, data.address, data.creds)
    
    return {
        "message": "Polymarket profile linked successfully", 
        "address": data.address,
        "profile": profile,
        "aml_status": aml_result["status"]
    }

@router.post("/accept-disclosure")
def accept_disclosure(user_id: str):
    try:
        accept_risk_disclosure(user_id)
        return {"message": "Risk disclosure accepted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/wipe-data")
def wipe_data(user_id: str):
    """
    Implements Right to be Forgotten.
    Deletes user and all associated simulator data.
    """
    try:
        wipe_user_data(user_id)
        return {"message": "All user data wiped successfully. You have been forgotten."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/purchase-slot")
def purchase_slot(user_id: str):
    checkout_url = create_checkout_session(user_id)
    if not checkout_url:
        raise HTTPException(status_code=500, detail="Failed to create checkout session")
    return {"checkout_url": checkout_url}

@router.post("/simulate_trade")
def simulate_trade(trade: CopyTradeRequest, user_id: str = "test_user_1"):
    db_user = get_user_by_id(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if float(db_user.get("simulation_capital", 0)) < trade.amount:
        raise HTTPException(status_code=400, detail="Insufficient simulated balance")

    # db_record_trade handles balance deduction and trade insertion in DynamoDB
    trade_item = db_record_trade(
        user_id=user_id,
        strategy_id="manual", # Placeholder for manual dashboard trades
        market_id=trade.market_id,
        position=trade.position,
        amount=trade.amount,
        price=trade.price_odds
    )

    return {"message": "Trade simulated successfully", "trade": trade_item}

# Mock market resolution
@router.post("/resolve_market")
def resolve_market(market_id: str, winning_side: str, user_id: str = "test_user_1"):
    if user_id not in SIMULATED_PORTFOLIOS:
         raise HTTPException(status_code=404, detail="Portfolio not found")
         
    portfolio = SIMULATED_PORTFOLIOS[user_id]
    
    to_remove = []
    realized_pnl = 0
    
    for pos in portfolio["open_positions"]:
        if pos["market_id"] == market_id:
            if pos["side"] == winning_side:
                # Won! Payout depends on entry odds. Simplistic: amount / odds
                payout = pos["amount_invested"] / pos["entry_price"]
                profit = payout - pos["amount_invested"]
                realized_pnl += profit
                portfolio["balance"] += payout
            else:
                # Lost
                realized_pnl -= pos["amount_invested"]
            to_remove.append(pos)
            
    for pos in to_remove:
        portfolio["open_positions"].remove(pos)
        
    portfolio["total_pnl"] += realized_pnl
    
    return {"message": f"Market resolved. Realized PnL: {realized_pnl}", "portfolio": portfolio}
