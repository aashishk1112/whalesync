import os
import boto3
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime, timezone
import uuid
import random
import string
from boto3.dynamodb.conditions import Key, Attr

# In SAM/Lambda environment, table names will be injected via environment variables
env = os.environ.get("ENVIRONMENT", "dev")
USERS_TABLE = os.environ.get("USERS_TABLE") or f"{env}-whalesync-users"
MARKETS_TABLE = os.environ.get("MARKETS_TABLE") or f"{env}-whalesync-markets"
TRADES_TABLE = os.environ.get("TRADES_TABLE") or f"{env}-whalesync-trades"
STRATEGIES_TABLE = os.environ.get("STRATEGIES_TABLE") or f"{env}-whalesync-strategies"
SUBSCRIPTION_TIERS_TABLE = os.environ.get("SUBSCRIPTION_TIERS_TABLE") or f"{env}-whalesync-subscription-tiers"

# Support local DynamoDB (LocalStack) via DYNAMODB_ENDPOINT env var
_endpoint = os.environ.get("DYNAMODB_ENDPOINT")  # e.g. http://localhost:4566
_kwargs = {
    "region_name": os.environ.get("AWS_REGION", "ap-south-1"),
}
if _endpoint:
    print(f"[DynamoDB] Using local endpoint: {_endpoint}")
    _kwargs["endpoint_url"] = _endpoint

dynamodb = boto3.resource("dynamodb", **_kwargs)

users_table = dynamodb.Table(USERS_TABLE)
markets_table = dynamodb.Table(MARKETS_TABLE)
trades_table = dynamodb.Table(TRADES_TABLE)
strategies_table = dynamodb.Table(STRATEGIES_TABLE)
subscription_tiers_table = dynamodb.Table(SUBSCRIPTION_TIERS_TABLE)

# --- Subscription Tier Management ---
_subscription_tiers_cache = {}

def get_subscription_tiers() -> Dict[str, Any]:
    """Fetch all subscription tiers from DynamoDB with simple caching."""
    global _subscription_tiers_cache
    if _subscription_tiers_cache:
        return _subscription_tiers_cache
    
    try:
        response = subscription_tiers_table.scan()
        tiers = {}
        for item in response.get('Items', []):
            tier_id = item.pop('tier_id')
            # Convert Decimals back to floats/ints for JSON compatibility
            for key, value in item.items():
                if isinstance(value, Decimal):
                    if value % 1 == 0:
                        item[key] = int(value)
                    else:
                        item[key] = float(value)
            tiers[tier_id] = item
        
        if tiers:
            print(f"[DynamoDB] Cached {len(tiers)} subscription tiers")
            _subscription_tiers_cache = tiers
            return tiers
    except Exception as e:
        print(f"[DynamoDB] Error fetching subscription tiers: {e}")
    
    # Fallback to a minimal "free" tier if DB is empty or fails
    return {
        "free": {
            "name": "Free",
            "slots": 1,
            "signal_delay_mins": 5,
            "ai_suggestions": False,
            "max_capital": 10000
        }
    }

def get_subscription_tier(tier_id: str) -> Dict[str, Any]:
    """Get config for a specific tier."""
    tiers = get_subscription_tiers()
    return tiers.get(tier_id, tiers.get("free"))

def get_now_iso():
    return datetime.now(timezone.utc).isoformat()

def generate_referral_code(length=6):
    """Generate a unique 6-character alphanumeric referral code."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def get_user_by_referral_code(referral_code: str):
    """Find a user by their unique referral code using scan (or index if available)."""
    try:
        # Check for IndexName='ReferralCodeIndex' if you have it, else scan
        response = users_table.scan(
            FilterExpression=Attr('referral_code').eq(referral_code)
        )
        return response['Items'][0] if response['Items'] else None
    except Exception as e:
        print(f"Error fetching user by referral code: {e}")
        return None

# --- User Ops ---
def create_user(email: str, username: str, picture_url: Optional[str] = None, referred_by_code: Optional[str] = None) -> Dict[str, Any]:
    user_id = str(uuid.uuid4())
    tier_config = get_subscription_tier("free")
    user_item = {
        "userId": user_id,  # Live schema key
        "user_id": user_id, # Alias for existing code
        "email": email,
        "username": username,
        "picture_url": picture_url,
        "simulation_capital": Decimal(str(tier_config["max_capital"])), # Default capital from tier
        "subscription_tier": "free",
        "source_slots": tier_config["slots"],             
        "copy_sources": [],            # List of followed addresses
        "created_at": get_now_iso()
    }
    
    # Referral System Logic
    user_item["referral_code"] = generate_referral_code()
    
    if referred_by_code:
        referrer = get_user_by_referral_code(referred_by_code)
        if referrer:
            user_item['referred_by'] = referrer['userId']
            # Reward the referrer: +1 slot
            try:
                add_user_slot(referrer['userId'])
                print(f"User {email} referred by {referrer['email']}. Referrer rewarded with +1 slot.")
            except Exception as e:
                print(f"Failed to reward referrer {referrer['userId']}: {e}")

    users_table.put_item(Item=user_item)
    return user_item

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    # Attempt query first
    try:
        response = users_table.query(
            IndexName="EmailIndex",
            KeyConditionExpression=boto3.dynamodb.conditions.Key("email").eq(email)
        )
        items = response.get("Items", [])
    except Exception:
        # Fallback to scan if index doesn't exist (Slow, but fixes 500/CORS error for now)
        response = users_table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr("email").eq(email)
        )
        items = response.get("Items", [])
        
    if items:
        # Standardize userId to user_id for the rest of the app if needed
        item = items[0]
        if "userId" in item: item["user_id"] = item["userId"]
        return item
    return None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    response = users_table.get_item(Key={"userId": user_id})
    item = response.get("Item")
    if item:
        # Standardize for both codes
        if "userId" in item: item["user_id"] = item["userId"]
        # Ensure new fields exist for old records
        if "subscription_tier" not in item:
             item["subscription_tier"] = "free"
        
        tier = item["subscription_tier"]
        tier_config = get_subscription_tier(tier)

        if "simulation_capital" not in item: item["simulation_capital"] = Decimal(str(tier_config["max_capital"]))
        if "source_slots" not in item: item["source_slots"] = tier_config["slots"]
        if "copy_sources" not in item: item["copy_sources"] = []
    return item

def update_user_subscription(user_id: str, tier: str, stripe_subscription_id: Optional[str] = None):
    """Updates user tier and resets slots according to new tier limits."""
    if tier not in get_subscription_tiers():
        return {"error": "Invalid tier"}
    
    tier_config = get_subscription_tier(tier)
    update_expr = "SET subscription_tier = :t, source_slots = :s"
    expr_vals = {
        ":t": tier,
        ":s": tier_config["slots"]
    }
    
    if stripe_subscription_id:
        update_expr += ", stripe_subscription_id = :sid"
        expr_vals[":sid"] = stripe_subscription_id
        
    users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=expr_vals
    )

def update_user_capital(user_id: str, new_capital: float):
    users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression="SET simulation_capital = :c",
        ExpressionAttributeValues={":c": Decimal(str(new_capital))}
    )

def add_copy_source(user_id: str, source: Dict[str, Any]):
    users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression="SET copy_sources = list_append(if_not_exists(copy_sources, :empty_list), :s)",
        ExpressionAttributeValues={
            ":s": [source],
            ":empty_list": []
        }
    )

def link_user_polymarket_address(user_id: str, address: str, creds: Optional[Dict[str, str]] = None):
    update_expr = "SET polymarket_address = :a"
    expr_vals = {":a": address}
    
    if creds:
        update_expr += ", polymarket_creds = :c"
        expr_vals[":c"] = creds # API Key, Secret, Passphrase (no private key)
        
    users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=expr_vals
    )

def accept_risk_disclosure(user_id: str):
    """Tracks that the user has accepted the mandatory risk disclosure."""
    users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression="SET risk_disclosure_accepted = :t, disclosure_accepted_at = :now",
        ExpressionAttributeValues={
            ":t": True,
            ":now": datetime.utcnow().isoformat()
        }
    )

def perform_aml_screening(address: str) -> Dict[str, Any]:
    """
    Mock AML screening service. 
    In production, this would call Chainalysis, TRM Labs, or Sumsub.
    """
    # Mock blacklist for demonstration
    blacklist = ["0x000000000000000000000000000000000000dead"]
    
    if address.lower() in blacklist:
        return {"status": "flagged", "reason": "Sanctioned Address (Mock)"}
    
    return {"status": "clear", "risk_score": 0.01}

def add_user_slot(user_id: str):
    print(f"DEBUG [add_user_slot]: Start for userId={user_id}")
    try:
        # First, let's verify if the user exists and what their current slots are
        user = get_user_by_id(user_id)
        if not user:
            print(f"ERROR [add_user_slot]: User {user_id} not found in database")
            raise Exception(f"User {user_id} not found")
        
        current_slots = user.get("source_slots", 6)
        print(f"DEBUG [add_user_slot]: Current slots for {user_id}: {current_slots}")
        
        response = users_table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET source_slots = if_not_exists(source_slots, :six) + :one",
            ExpressionAttributeValues={
                ":one": 1,
                ":six": 6 # Default is 6 as per schema
            },
            ReturnValues="UPDATED_NEW"
        )
        new_slots = response.get('Attributes', {}).get('source_slots')
        print(f"DEBUG [add_user_slot]: Successfully incremented. New slots: {new_slots}")
    except Exception as e:
        print(f"CRITICAL ERROR [add_user_slot]: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e

def update_copy_source_status(user_id: str, source_id: str, active: bool):
    user = get_user_by_id(user_id)
    if not user or "copy_sources" not in user:
        return False
    
    sources = user["copy_sources"]
    updated = False
    for s in sources:
        if s.get("id") == source_id:
            s["active"] = active
            updated = True
            break
            
    if updated:
        users_table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET copy_sources = :s",
            ExpressionAttributeValues={":s": sources}
        )
    return updated

def delete_copy_source(user_id: str, source_id: str):
    user = get_user_by_id(user_id)
    if not user or "copy_sources" not in user:
        return False
    
    sources = [s for s in user["copy_sources"] if s.get("id") != source_id]
    
    users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression="SET copy_sources = :s",
        ExpressionAttributeValues={":s": sources}
    )
    return True

# --- Markets Ops ---
def create_market(market_data: dict) -> Dict[str, Any]:
    market_id = market_data.get("market_id", str(uuid.uuid4()))
    item = {**market_data, "market_id": market_id, "updated_at": get_now_iso()}
    markets_table.put_item(Item=item)
    return item

def list_markets_by_platform(platform: Optional[str] = None) -> List[Dict[str, Any]]:
    if platform:
        response = markets_table.query(
            IndexName="PlatformIndex",
            KeyConditionExpression=boto3.dynamodb.conditions.Key("platform").eq(platform)
        )
        return response.get("Items", [])
    else:
        # Full scan for generic listing (assuming small dataset for MVP)
        response = markets_table.scan()
        return response.get("Items", [])

# --- Trades & Portfolio Ops ---
def record_trade(user_id: str, strategy_id: str, market_id: str, position: str, amount: float, price: float, category: str = "All", tx_hash: Optional[str] = None) -> Optional[Dict[str, Any]]:
    # 1. Update Strategy Balance with hard stop if fully depleted
    try:
        strategies_table.update_item(
            Key={"strategy_id": strategy_id},
            UpdateExpression="SET strategy_balance = strategy_balance - :amt",
            ConditionExpression="strategy_balance > :amt", # Must be strictly greater to avoid zeroing out
            ExpressionAttributeValues={":amt": Decimal(str(amount))}
        )
    except Exception as e:
        print(f"ERROR [record_trade]: Strategy {strategy_id} out of funds? amount={amount}. Error: {e}")
        return None

    # 2. Deduct from user's global simulation capital
    try:
        users_table.update_item(
            Key={"userId": user_id},
            UpdateExpression="SET simulation_capital = simulation_capital - :amt",
            ConditionExpression="simulation_capital >= :amt",
            ExpressionAttributeValues={":amt": Decimal(str(amount))}
        )
    except Exception as e:
        # Rolled back strategy balance implicitly? No, need to manually revert or handle gracefully
        # In this simple model, we'll just log and fail, but atomicity would be handled by transactions in prod
        print(f"ERROR [record_trade]: Global balance deduction failed for user {user_id}. amount={amount}. Error: {e}")
        # Manual Rollback for strategy balance
        strategies_table.update_item(
            Key={"strategy_id": strategy_id},
            UpdateExpression="SET strategy_balance = strategy_balance + :amt",
            ExpressionAttributeValues={":amt": Decimal(str(amount))}
        )
        return None

    trade_id = str(uuid.uuid4())
    trade_item = {
        "trade_id": trade_id,
        "user_id": user_id,
        "strategy_id": strategy_id,
        "market_id": market_id,
        "position": position,
        "amount": Decimal(str(amount)),
        "price": Decimal(str(price)),
        "category": category,
        "tx_hash": tx_hash,
        "created_at": get_now_iso(),
        "status": "open" # Initial status
    }
    
    try:
        trades_table.put_item(Item=trade_item)
        return trade_item
    except Exception as e:
        # Critical failure: balance was deducted but trade record failed
        # In a real app, we would rollback the balance here
        print(f"CRITICAL ERROR [record_trade]: Failed to record trade item after balance deduction: {e}")
        return None

def get_user_trades(user_id: str) -> List[Dict[str, Any]]:
    response = trades_table.scan(
        FilterExpression=Attr("user_id").eq(user_id)
    )
    return response.get("Items", [])

# --- Strategy Ops ---
def create_strategy(user_id: str, strategy_data: Dict[str, Any]) -> Dict[str, Any]:
    print(f"Persisting strategy {strategy_data.get('strategy_id')} for user {user_id}")
    strategy_data["user_id"] = user_id
    strategy_data["created_at"] = get_now_iso()
    
    # Convert floats to Decimals for DynamoDB
    if "allocation_percentage" in strategy_data:
        strategy_data["allocation_percentage"] = Decimal(str(strategy_data["allocation_percentage"]))
    if "bet_size_percentage" in strategy_data:
        strategy_data["bet_size_percentage"] = Decimal(str(strategy_data["bet_size_percentage"]))
    if "simulated_pnl" in strategy_data:
        strategy_data["simulated_pnl"] = Decimal(str(strategy_data["simulated_pnl"]))
    
    # Initialize strategy status and live flag
    strategy_data["is_live"] = strategy_data.get("is_live", False)
    
    # Initialize strategy balance based on allotment
    user = get_user_by_id(user_id)
    if user:
        total_cap = float(user.get("simulation_capital", 10000.0))
        allocation = float(strategy_data.get("allocation_percentage", 0))
        strategy_data["strategy_balance"] = Decimal(str((allocation / 100.0) * total_cap))
        strategy_data["initial_allocation_dollars"] = strategy_data["strategy_balance"]
        
    try:
        strategies_table.put_item(Item=strategy_data)
        print(f"Strategy persisted successfully with balance: {strategy_data.get('strategy_balance')}")
    except Exception as e:
        print(f"Error persisting strategy in DynamoDB: {e}")
        raise e
    return strategy_data

def get_user_strategies(user_id: str) -> List[Dict[str, Any]]:
    response = strategies_table.scan(
        FilterExpression=Attr("user_id").eq(user_id)
    )
    return response.get("Items", [])

def update_strategy_status(strategy_id: str, status: str):
    strategies_table.update_item(
        Key={"strategy_id": strategy_id},
        UpdateExpression="SET #s = :val",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":val": status}
    )

def delete_strategy(strategy_id: str):
    strategies_table.delete_item(Key={"strategy_id": strategy_id})

def get_strategy_trades(strategy_id: str) -> List[Dict[str, Any]]:
    response = trades_table.scan(
        FilterExpression=Attr("strategy_id").eq(strategy_id)
    )
    return response.get("Items", [])

def delete_all_user_strategies(user_id: str):
    strategies = get_user_strategies(user_id)
    for s in strategies:
        strategies_table.delete_item(Key={"strategy_id": s["strategy_id"]})
        # Remove associated trades too
        trades = get_strategy_trades(s["strategy_id"])
        for t in trades:
            trades_table.delete_item(Key={"trade_id": t["trade_id"]})

def wipe_user_data(user_id: str):
    """
    Implements 'Right to be Forgotten'. Deletes user record, strategies, and trades.
    """
    # 1. Delete all strategies and their trades
    delete_all_user_strategies(user_id)
    
    # 2. Delete any orphaned trades directly associated with user_id
    trades = get_user_trades(user_id)
    for t in trades:
        trades_table.delete_item(Key={"trade_id": t["trade_id"]})
        
    # 3. Finally, delete the user record
    users_table.delete_item(Key={"userId": user_id})
