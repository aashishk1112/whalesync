from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import uuid
import asyncio
import json
from typing import List, Optional, Dict, Any, Set
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
    bet_size_percentage: float = 5.0
    source_addresses: List[str]
    category: str = "All"
    is_live: bool = False
    risk_mode: str = "Balanced"

class MirrorRequest(BaseModel):
    address: str
    username: str
    risk_mode: str = "Balanced"

class PreviewRequest(BaseModel):
    trader_ids: List[str]
    risk_mode: str = "Balanced"
    allocation: float = 10.0
    trade_size: float = 5.0

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
                                strategy_balance = float(s.get("strategy_balance", 0))
                                initial_alloc = float(s.get("initial_allocation_dollars", 1000.0))
                                bet_percentage = float(s.get("bet_size_percentage", 5.0))
                                
                                trade_amount = (bet_percentage / 100.0) * initial_alloc
                                
                                # Risk Mode Adjustment (Conservative: smaller trades, Aggressive: larger trades)
                                risk_mode = s.get("risk_mode", "Balanced")
                                if risk_mode == "Conservative": trade_amount *= 0.5
                                elif risk_mode == "Aggressive": trade_amount *= 1.5

                                # Hard Stop: If trade amount > remaining strategy balance, do not execute
                                if trade_amount > strategy_balance:
                                    print(f"STOPPED trade for strategy {s['name']}: Not enough strategy balance")
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
                                    s["strategy_balance"] = float(s["strategy_balance"]) - trade_amount
                except Exception as e:
                    print(f"Sync error for {addr}: {e}")

        # Calculate live PnL based on latest market prices
        total_pnl = 0.0
        market_prices = {}
        for t in strategy_trades:
            if t.get("status") == "open":
                m_id = t["market_id"]
                if m_id not in market_prices:
                    try: market_prices[m_id] = polymarket_service.get_market_price(m_id)
                    except: market_prices[m_id] = float(t.get("price", 0.5))
                
                curr_price = market_prices[m_id]
                entry_price = float(t.get("price", 0.5))
                amount = float(t.get("amount", 0))
                
                if entry_price > 0:
                    total_pnl += (curr_price - entry_price) * (amount / entry_price)
        
        s["simulated_pnl"] = round(total_pnl, 2)

    return {"strategies": strategies}

@router.post("/")
def create_strategy(strategy: StrategyCreate, user_id: str):
    print(f"Creating strategy for user {user_id}: {strategy.name}")
    
    if strategy.allocation_percentage < 5 or strategy.allocation_percentage > 100:
        raise HTTPException(status_code=400, detail="Allocation must be between 5% and 100%")

    strategies = get_user_strategies(user_id)
    active_total = sum(float(s.get("allocation_percentage") or 0) for s in strategies if (s.get("status") in ["active", "paused", "stopped"]))
    
    db_user = get_user_by_id(user_id)
    if not db_user: raise HTTPException(status_code=404, detail="User not found")
        
    source_slots = int(db_user.get("source_slots", 10))
    if len(strategies) >= source_slots:
        raise HTTPException(status_code=403, detail="SLOTS_FULL")

    if active_total + strategy.allocation_percentage > 100:
        raise HTTPException(status_code=400, detail="INSUFFICIENT_BUDGET")

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
        "risk_mode": strategy.risk_mode,
        "status": "active",
        "simulated_pnl": 0.0
    }
    
    try:
        db_create_strategy(user_id, new_strategy)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save strategy")
    
    return {"message": "Strategy created", "strategy": new_strategy}

@router.post("/mirror")
def mirror_trader(request: MirrorRequest, user_id: str):
    """One-click mirroring helper."""
    db_user = get_user_by_id(user_id)
    if not db_user: raise HTTPException(status_code=404, detail="User not found")
        
    strategies = get_user_strategies(user_id)
    if len(strategies) >= int(db_user.get("source_slots", 10)):
        raise HTTPException(status_code=403, detail="SLOTS_FULL")
        
    active_total = sum(float(s.get("allocation_percentage") or 0) for s in strategies)
    allowance = min(10.0, 100.0 - active_total)
    
    if allowance < 1.0: raise HTTPException(status_code=400, detail="INSUFFICIENT_BUDGET")

    strat_id = str(uuid.uuid4())
    new_strategy = {
        "strategy_id": strat_id,
        "name": f"Mirror: {request.username}",
        "platform": "Polymarket",
        "allocation_percentage": allowance,
        "bet_size_percentage": 5.0,
        "source_addresses": [request.address],
        "category": "All",
        "is_live": False,
        "risk_mode": request.risk_mode,
        "status": "active",
        "simulated_pnl": 0.0
    }
    
    db_create_strategy(user_id, new_strategy)
    return {"message": "Mirror strategy created", "strategy": new_strategy}

@router.post("/preview")
def preview_strategy(request: PreviewRequest):
    """Calculates expected performance for a given strategy configuration."""
    if not request.trader_ids:
        return {"expected_pnl_7d": 0, "win_rate": 0, "max_drawdown": 0, "confidence_score": 0, "recent_signals": []}
    
    risk_multipliers = {"Conservative": 0.5, "Balanced": 1.0, "Aggressive": 1.8}
    multi = risk_multipliers.get(request.risk_mode, 1.0)
    count = len(request.trader_ids)
    diversification_bonus = min(1.2, 1.0 + (count * 0.05))
    
    expected_roi_weekly = 0.02 * multi
    expected_pnl = (10000 * (request.allocation / 100)) * expected_roi_weekly * diversification_bonus
    win_rate = min(0.85, 0.58 + (count * 0.01))
    drawdown = min(0.4, (0.05 * multi) / diversification_bonus)
    confidence = min(0.95, 0.65 + (count * 0.05))
    
    return {
        "expected_pnl_7d": round(expected_pnl, 2),
        "win_rate": round(win_rate * 100, 1),
        "max_drawdown": round(drawdown * 100, 1),
        "confidence_score": round(confidence * 100, 1),
        "recent_signals": [
            f"Analyzing {count} high-signal addresses",
            f"Risk profile: {request.risk_mode}",
            "Diversification bonus applied"
        ]
    }

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
# WebSocket Manager for Real-time Strategy Updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_user_update(self, user_id: str, data: dict):
        if user_id in self.active_connections:
            message = json.dumps(data)
            for connection in self.active_connections[user_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def strategy_websocket(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        # Initial push: get current strategies
        data = get_strategies(user_id)
        await websocket.send_text(json.dumps(data))
        
        # Keep alive and handle incoming (if any)
        while True:
            # Periodically push updates every 5 seconds for simulation feel
            await asyncio.sleep(5)
            data = get_strategies(user_id)
            await websocket.send_text(json.dumps(data))
            
            # Use this loop to listen for client messages if needed
            # For now, just a passive push
            # await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket Error for {user_id}: {e}")
        manager.disconnect(websocket, user_id)
