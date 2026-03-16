from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
from typing import List, Optional, Dict, Any
from services.dynamodb_service import (
    create_strategy as db_create_strategy,
    get_user_strategies,
    update_strategy_status,
    record_trade,
    delete_strategy,
    get_user_by_id
)
from services.polymarket_service import polymarket_service

router = APIRouter()

class StrategyCreate(BaseModel):
    name: str
    platform: str
    allocation_percentage: float
    bet_size_percentage: float = 5.0 # Amount of strategy-specific balance to use per trade
    source_addresses: List[str] # Multiple selection
    category: str = "All" # Optional category for filtering
    is_live: bool = False # Flag for live market interaction

@router.get("/")
def get_strategies(user_id: str):
    from services.dynamodb_service import get_strategy_trades
    
    strategies = get_user_strategies(user_id)
    
    # Mirror real-world activity + Calculate live PnL for active strategies
    for s in strategies:
        strategy_trades = get_strategy_trades(s["strategy_id"])
        
        if s.get("status") == "active" and s.get("platform") == "Polymarket":
            # Balance Guard: If balance is <= 0, do not execute new mirrored trades
            db_user = get_user_by_id(user_id)
            if not db_user or float(db_user.get("simulation_capital", 0)) <= 0:
                print(f"Skipping sync for strategy {s['name']}: User not found or insufficient simulation balance.")
                continue

            for addr in s.get("source_addresses", []):
                try:
                    # Fetch real activities from Polymarket
                    real_trades = polymarket_service.get_trader_activity(addr)
                    # Get current trades for deduplication
                    existing_tx_hashes = {t.get("tx_hash") for t in strategy_trades if t.get("tx_hash")}
                    
                    for rt in real_trades:
                        tx_hash = rt.get("transactionHash")
                        market_id = rt.get("conditionId") or rt.get("slug")
                        
                        if tx_hash and tx_hash not in existing_tx_hashes:
                            # Verify category match for mirroring
                            trade_allowed = False
                            strategy_category = s.get("category", "All")
                            
                            if strategy_category == "All":
                                trade_allowed = True
                            else:
                                # Need to fetch market details to check category
                                market_details = polymarket_service.get_market_details(market_id)
                                market_cat = market_details.get("category", "")
                                if market_cat.lower() == strategy_category.lower():
                                    trade_allowed = True
                                    print(f"Category match: {market_cat} for strategy {s['name']}")
                            
                                if trade_allowed:
                                    # Calculate trade amount based on strategy-specific bet size
                                    # Amount = BetSize% of (Strategy Initial Allocation)
                                    strategy_balance = float(s.get("strategy_balance", 0))
                                    initial_alloc = float(s.get("initial_allocation_dollars", 1000.0))
                                    bet_percentage = float(s.get("bet_size_percentage", 5.0))
                                    
                                    trade_amount = (bet_percentage / 100.0) * initial_alloc
                                    
                                    # Hard Stop: If trade amount > remaining strategy balance, do not execute
                                    if trade_amount > strategy_balance:
                                        print(f"STOPPED trade for strategy {s['name']}: Not enough strategy balance (${strategy_balance:.2f} < ${trade_amount:.2f})")
                                        continue

                                    # Mirror this trade into our simulator
                                    side = str(rt.get("side") or "").upper()
                                    new_trade = record_trade(
                                        user_id=user_id,
                                        strategy_id=s["strategy_id"],
                                        market_id=market_id,
                                        position="YES" if side == "BUY" else "NO",
                                        price=float(rt.get("price", 0.5)),
                                        amount=trade_amount,
                                        category=s.get("category", "All"),
                                        tx_hash=tx_hash
                                    )
                                    if new_trade:
                                        strategy_trades.append(new_trade)
                                        # Update the local s dict to reflect new balance (though s is just a copy from DB scan usually)
                                        s["strategy_balance"] = float(s["strategy_balance"]) - trade_amount
                                        print(f"Mirrored real trade {tx_hash} for {addr} in strategy {s['strategy_id']}. Remaining Balance: ${s['strategy_balance']:.2f}")
                                    else:
                                        print(f"SKIPPED trade {tx_hash} for {addr} due to global capital exhaustion or record error")
                except Exception as e:
                    print(f"Sync error for {addr}: {e}")

        # Calculate live PnL based on latest market prices
        total_pnl = 0.0
        market_prices = {} # Cache prices within this strategy to save API calls
        for t in strategy_trades:
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
                
                if entry_price > 0:
                    # PnL = (Current - Entry) * (Amount / Entry)
                    total_pnl += (curr_price - entry_price) * (amount / entry_price)
        
        s["simulated_pnl"] = round(total_pnl, 2)

    return {"strategies": strategies}

@router.post("/")
def create_strategy(strategy: StrategyCreate, user_id: str):
    print(f"Creating strategy for user {user_id}: {strategy.name}")
    
    if strategy.allocation_percentage < 5 or strategy.allocation_percentage > 100:
        raise HTTPException(status_code=400, detail="Allocation must be between 5% and 100%")

    # Check total allocation
    strategies = get_user_strategies(user_id)
    # Filter for active strategies and ensure we exclude the one we might be editing (though this is POST)
    active_total = sum(float(s.get("allocation_percentage") or 0) for s in strategies if (s.get("status") in ["active", "paused", "stopped"]))
    
    if active_total + strategy.allocation_percentage > 100:
        raise HTTPException(
            status_code=400, 
            detail=f"Remaining allocation budget is {100 - active_total}%. Your request for {strategy.allocation_percentage}% exceeds this."
        )

    strat_id = str(uuid.uuid4())
    new_strategy = {
        "strategy_id": strat_id,
        "name": strategy.name,
        "platform": strategy.platform,
        "allocation_percentage": strategy.allocation_percentage,
        "bet_size_percentage": strategy.bet_size_percentage,
        "source_addresses": strategy.source_addresses,
        "category": strategy.category,
        "is_live": strategy.is_live,
        "status": "active",
        "simulated_pnl": 0.0
    }
    
    try:
        db_create_strategy(user_id, new_strategy)
        print(f"Strategy {strat_id} persisted in DB")
    except Exception as e:
        print(f"Error persisting strategy: {e}")
        raise HTTPException(status_code=500, detail="Failed to save strategy to database")
    
    # Optional: Initial Simulation Step
    if strategy.platform == "Polymarket":
        try:
            markets = polymarket_service.get_live_markets()
            if markets and len(markets) > 0:
                market = markets[0] # Pick first active market for demo
                condition_id = market.get("conditionId") or "0x..."
                price = polymarket_service.get_market_price(condition_id)
                
                # Record a mock trade for this strategy
                initial_alloc = (strategy.allocation_percentage / 100.0) * 10000.0 # Standard initial cap estimation
                trade_amount = (strategy.bet_size_percentage / 100.0) * initial_alloc

                record_trade(
                    user_id=user_id,
                    strategy_id=strat_id,
                    market_id=condition_id,
                    position="YES",
                    price=price,
                    amount=trade_amount,
                    category=strategy.category
                )
                print(f"Mock trade recorded for strategy {strat_id} with amount ${trade_amount}")
        except Exception as e:
            print(f"Non-critical error in initial simulation: {e}")

    return {"message": "Strategy created", "strategy": new_strategy}

@router.get("/{strategy_id}/trades")
def get_strategy_trades(strategy_id: str):
    from services.dynamodb_service import get_strategy_trades as db_get_trades
    return {"trades": db_get_trades(strategy_id)}

@router.post("/{strategy_id}/resume")
def resume_strategy(strategy_id: str):
    update_strategy_status(strategy_id, "active")
    return {"message": "Strategy resumed"}

@router.post("/{strategy_id}/stop")
def stop_strategy(strategy_id: str):
    update_strategy_status(strategy_id, "stopped")
    return {"message": "Strategy stopped"}

@router.delete("/{strategy_id}")
def remove_strategy(strategy_id: str):
    # delete_strategy implementation in dynamodb_service
    from services.dynamodb_service import delete_strategy
    delete_strategy(strategy_id)
    return {"message": "Strategy deleted"}

@router.post("/backtest")
def run_backtest(strategy: StrategyCreate):
    # Mocking backtest results
    return {
        "metrics": {
            "roi": 24.5,
            "win_rate": 0.68,
            "max_drawdown": 5.2,
            "trades_executed": 142
        },
        "equity_curve": [
            {"day": 1, "value": 10000},
            {"day": 30, "value": 11200},
            {"day": 60, "value": 10800},
            {"day": 90, "value": 12450}
        ]
    }
