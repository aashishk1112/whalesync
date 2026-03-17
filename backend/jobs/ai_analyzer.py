import asyncio
import time
from services.signal_engine import signal_engine
from services.scoring_service import scoring_service
from services.polymarket_service import polymarket_service
from services.dynamodb_service import save_ai_analysis, users_table
from datetime import datetime

async def run_ai_analysis_cycle():
    """
    The 15-minute background job to fetch leaders, score them, and generate signals.
    """
    print(f"[{datetime.now()}] Starting AI Analysis Cycle...")
    
    try:
        # 1. Fetch Global Leaders
        raw_traders = polymarket_service.get_leaderboard(timeframe="DAY", limit=20)
        
        # 2. Get Followed Leaders from all users
        # In a real app, we'd query for all distinct followed addresses
        try:
            response = users_table.scan(AttributesToGet=['copy_sources'])
            followed_addresses = set()
            for user in response.get('Items', []):
                for src in user.get('copy_sources', []):
                    if src.get('address') and src.get('platform') == 'Polymarket':
                        followed_addresses.add(src['address'])
            
            # Add followed addresses to our scan list if not already there
            for addr in followed_addresses:
                # Mock a trader object for scoring if not in leaderboard
                if not any(t.get('proxyWallet') == addr for t in raw_traders):
                    raw_traders.append({"proxyWallet": addr, "userName": "Followed Trader", "pnl": 0})
        except Exception as e:
            print(f"Warning: Could not fetch followed addresses: {e}")

        # 3. Calculate Scores & Save
        scored_traders = scoring_service.rank_traders(raw_traders)
        # Standardized: Type=TRADER_SCORES, ID=ALL_POLYMARKET
        save_ai_analysis("TRADER_SCORES", scored_traders, "ALL_POLYMARKET")
        
        # Save individual scores for faster lookup during copy trading validation
        for trader in scored_traders:
            addr = trader.get("proxyWallet")
            if addr:
                # Standardized: Type=SCORE, ID=WALLET_ADDRESS
                save_ai_analysis("SCORE", trader, addr)

        # 4. Generate & Save Consensus Signals
        signals = await signal_engine.generate_consensus_signals()
        # Standardized: Type=SIGNALS, ID=GLOBAL_POLYMARKET
        save_ai_analysis("SIGNALS", signals, "GLOBAL_POLYMARKET")
        
        print(f"[{datetime.now()}] AI Analysis Cycle Complete. {len(scored_traders)} traders scored, {len(signals)} signals generated.")
        
    except Exception as e:
        print(f"CRITICAL ERROR in AI Analysis Cycle: {e}")
        import traceback
        traceback.print_exc()

async def main_loop():
    while True:
        await run_ai_analysis_cycle()
        # Wait for 15 minutes
        print("Sleeping for 15 minutes...")
        await asyncio.sleep(15 * 60)

if __name__ == "__main__":
    asyncio.run(main_loop())
