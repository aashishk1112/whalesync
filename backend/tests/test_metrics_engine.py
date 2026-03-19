import sys
import os
import numpy as np

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.metrics_engine import MetricsEngine

def test_adjusted_roi():
    print("Testing Adjusted ROI...")
    # Case 1: High Volume, High PNL
    roi = MetricsEngine.calculate_adjusted_roi(1000, 10000, 0.1)
    print(f"High Vol ROI: {roi}")
    assert roi > 0

    # Case 2: Low Volume, High PNL (Should be dampened)
    roi_low = MetricsEngine.calculate_adjusted_roi(1000, 100, 0.1)
    print(f"Low Vol ROI: {roi_low}")
    assert roi_low < 0.2 # (1000 / (100 + 5000)) = 0.196

    # Case 3: High Drawdown (Should be lower)
    roi_dd = MetricsEngine.calculate_adjusted_roi(1000, 10000, 0.5)
    print(f"High DD ROI: {roi_dd}")
    assert roi_dd < roi

def test_risk_score():
    print("\nTesting Risk Score...")
    # Case 1: Conservative (Low DD, small bets)
    risk = MetricsEngine.calculate_risk_score(0.05, 50, 10000)
    print(f"Conservative Risk: {risk}")
    assert risk < 0.1

    # Case 2: Aggressive (High DD, large bets)
    risk_agg = MetricsEngine.calculate_risk_score(0.4, 2000, 5000)
    print(f"Aggressive Risk: {risk_agg}")
    assert risk_agg > 0.3

def test_whale_score():
    print("\nTesting Whale Score...")
    # Case 1: The Ultimate Whale
    score = MetricsEngine.calculate_whale_score(
        adjusted_roi=0.2,
        win_rate=0.8,
        volume=1000000,
        consistency_score=0.9,
        max_drawdown=0.05
    )
    print(f"Ultimate Whale Score: {score}")
    assert score > 80

    # Case 2: The Newbie (Low vol, high DD)
    score_newbie = MetricsEngine.calculate_whale_score(
        adjusted_roi=0.05,
        win_rate=0.4,
        volume=1000,
        consistency_score=0.2,
        max_drawdown=0.6
    )
    print(f"Newbie Score: {score_newbie}")
    assert score_newbie < 40

if __name__ == "__main__":
    try:
        test_adjusted_roi()
        test_risk_score()
        test_whale_score()
        print("\n✅ All Metrics Engine tests passed!")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
