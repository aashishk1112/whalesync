import pytest
import requests
import os
import uuid
import time
from decimal import Decimal

# Configuration
BASE_URL = "http://localhost:8000"  # Assuming backend is running or we use TestClient
# But since we want to test "integrations", we'll use a real FastAPI environment if possible
# Alternatively, we can use the services directly.

from services.dynamodb_service import create_user, get_user_by_id, get_user_strategies
from routes.strategies import StrategyCreate, create_strategy, get_strategies

def test_full_strategy_workflow():
    # 1. Setup - Ensure LocalStack has tables (already done by script)
    
    # 2. Create a Dummy User
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    username = "TestUser"
    user = create_user(email, username)
    user_id = user["userId"]
    print(f"Created Test User: {user_id}")
    
    # 3. Create a Strategy (Mirroring a known Polymarket Whale)
    # Using a known active address if possible, or just a dummy one for now
    whale_address = "0x789e02c9384742e94f1be8515ce9254dfb8858f0" # Replace with real if needed
    
    strat_data = {
        "name": "Power Mirror",
        "platform": "Polymarket",
        "allocation_percentage": 20.0,
        "bet_size_percentage": 5.0,
        "source_addresses": [whale_address],
        "category": "All",
        "is_live": True,
        "risk_mode": "Balanced"
    }
    
    # Simulate the API call
    from routes.strategies import StrategyCreate
    strat_obj = StrategyCreate(**strat_data)
    response = create_strategy(strat_obj, user_id)
    assert response["message"] == "Strategy created"
    strat_id = response["strategy"]["strategy_id"]
    print(f"Created Strategy: {strat_id}")
    
    # 4. Verify Strategy Persistence
    strategies = get_user_strategies(user_id)
    assert len(strategies) == 1
    assert strategies[0]["name"] == "Power Mirror"
    assert strategies[0]["status"] == "active"
    
    # 5. Trigger Mirroring (Sync)
    # This might take time as it calls external Polymarket API
    print("Triggering Mirroring Sync...")
    sync_res = get_strategies(user_id)
    assert "strategies" in sync_res
    
    # 6. Check for mirrored trades in DynamoDB
    from services.dynamodb_service import get_strategy_trades
    trades = get_strategy_trades(strat_id)
    print(f"Mirrored {len(trades)} trades.")
    
    # If the whale has real trades, we should see some here
    # Since we can't guarantee live activity during test, we at least check it doesn't crash
    # and properly interacts with LocalStack.
    
    # 7. Cleanup (Optional for LocalStack)
    # wipe_user_data(user_id)

if __name__ == "__main__":
    test_full_strategy_workflow()
