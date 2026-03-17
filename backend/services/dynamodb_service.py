import os
import boto3
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime, timezone
import uuid
from boto3.dynamodb.conditions import Key, Attr

# In SAM/Lambda environment, table names will be injected via environment variables
USERS_TABLE = os.environ.get("USERS_TABLE") or os.environ.get("DYNAMODB_TABLE") or "ScalarUsers"
MARKETS_TABLE = os.environ.get("MARKETS_TABLE") or "Whalesync-Markets"
TRADES_TABLE = os.environ.get("TRADES_TABLE") or "ScalarTrades"
STRATEGIES_TABLE = os.environ.get("STRATEGIES_TABLE") or "ScalarStrategies"

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

def get_now_iso():
    return datetime.now(timezone.utc).isoformat()

# --- User Ops ---
def create_user(email: str, username: str, picture_url: Optional[str] = None) -> Dict[str, Any]:
    user_id = str(uuid.uuid4())
    user_item = {
        "userId": user_id,  # Live schema key
        "user_id": user_id, # Alias for existing code
        "email": email,
        "username": username,
        "picture_url": picture_url,
        "simulation_capital": Decimal("10000.0"), # Default capital
        "source_slots": 6,             # 2 per platform x 3 platforms
        "copy_sources": [],            # List of followed addresses
        "created_at": get_now_iso()
    }
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
        if "simulation_capital" not in item: item["simulation_capital"] = Decimal("10000.0")
        if "source_slots" not in item: item["source_slots"] = 6
        if "copy_sources" not in item: item["copy_sources"] = []
    return item

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

def link_user_polymarket_address(user_id: str, address: str, creds: Dict[str, str] = None):
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

def list_markets_by_platform(platform: str = None) -> List[Dict[str, Any]]:
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
def record_trade(user_id: str, strategy_id: str, market_id: str, position: str, amount: float, price: float, category: str = "All", tx_hash: str = None) -> Optional[Dict[str, Any]]:
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
# --- AI Analysis Storage ---
def save_ai_analysis(analysis_type: str, data: Any, target_id: str = "global"):
    """
    Saves AI scores or signals. 
    target_id can be 'global' for market signals or a wallet address for trader scores.
    """
    timestamp = get_now_iso()
    item = {
        "analysis_id": f"{analysis_type}:{target_id}",
        "type": analysis_type, # 'signal' or 'trader_score'
        "target_id": target_id,
        "data": data, # This can be a JSON-serializable dict or list
        "updated_at": timestamp
    }
    
    # We'll use the markets_table for metadata storage as a shortcut for now, 
    # or ideally a separate table. Let's use strategies_table for 'ai_cache' items
    # if it doesn't conflict, but a dedicated 'Whalesync-AI' table is better.
    # For now, let's assume we use a specific key in the markets table or strategies table.
    try:
        from decimal import Decimal
        from datetime import datetime

        # Helper to convert float to decimal recursively
        def dec(obj):
            if isinstance(obj, float):
                return Decimal(str(obj))
            if isinstance(obj, dict):
                return {k: dec(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [dec(v) for v in obj]
            return obj

        clean_data = dec(data)
        
        # Standardized key: AI_CACHE_{TYPE}_{ID}
        cache_key = f"AI_CACHE_{analysis_type.upper()}_{target_id.upper()}"
        
        strategies_table.put_item(
            Item={
                'strategy_id': cache_key,
                'user_id': "SYSTEM",
                'type': "AI_CACHE",
                'analysis_type': analysis_type.upper(),
                'target_id': target_id.upper(),
                'data': clean_data,
                'timestamp': datetime.utcnow().isoformat(),
                'updated_at': get_now_iso()
            }
        )
    except Exception as e:
        print(f"Error saving AI analysis: {e}")

def get_latest_ai_analysis(analysis_type: str, target_id: str = "global") -> Optional[Dict[str, Any]]:
    try:
        cache_key = f"AI_CACHE_{analysis_type.upper()}_{target_id.upper()}"
        response = strategies_table.get_item(Key={"strategy_id": cache_key})
        return response.get("Item")
    except Exception as e:
        print(f"Error fetching AI analysis: {e}")
        return None
