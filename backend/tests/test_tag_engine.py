import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.metrics_engine import TagEngine

def test_tags():
    print("Testing Tag Engine...")
    
    # Whale
    trader_whale = {"avg_bet_size": 15000, "total_trades": 10, "win_rate": 0.5}
    tags = TagEngine.assign_tags(trader_whale)
    print(f"Whale Tags: {tags}")
    assert "whale" in tags

    # Scalper
    trader_scalper = {"avg_bet_size": 100, "total_trades": 60, "win_rate": 0.6}
    tags = TagEngine.assign_tags(trader_scalper)
    print(f"Scalper Tags: {tags}")
    assert "scalper" in tags

    # Sniper
    trader_sniper = {"avg_bet_size": 500, "total_trades": 10, "win_rate": 0.8}
    tags = TagEngine.assign_tags(trader_sniper)
    print(f"Sniper Tags: {tags}")
    assert "sniper" in tags

    # Momentum
    trader_momentum = {
        "avg_bet_size": 200, 
        "total_trades": 5, 
        "win_rate": 0.5, 
        "pnl_history": [10, 20, -5, 50, 100] # Increasing
    }
    tags = TagEngine.assign_tags(trader_momentum)
    print(f"Momentum Tags: {tags}")
    assert "momentum" in tags

if __name__ == "__main__":
    try:
        test_tags()
        print("\n✅ All Tag Engine tests passed!")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
