import boto3
import os
import time
from decimal import Decimal

# Configuration - should match .env.development
ENDPOINT_URL = "http://localhost:4566"
REGION = "ap-south-1"
PREFIX = "dev-whalesync"

dynamodb = boto3.resource("dynamodb", endpoint_url=ENDPOINT_URL, region_name=REGION)
client = boto3.client("dynamodb", endpoint_url=ENDPOINT_URL, region_name=REGION)

def create_table(name, key_schema, attr_defs, gsi=None):
    try:
        params = {
            "TableName": name,
            "KeySchema": key_schema,
            "AttributeDefinitions": attr_defs,
            "BillingMode": "PAY_PER_REQUEST"
        }
        if gsi:
            params["GlobalSecondaryIndexes"] = gsi
            
        dynamodb.create_table(**params)
        print(f"Creating table {name}...")
    except client.exceptions.ResourceInUseException:
        print(f"Table {name} already exists.")

def setup_tables():
    # 1. Users Table
    create_table(
        f"{PREFIX}-users",
        [{"AttributeName": "userId", "KeyType": "HASH"}],
        [
            {"AttributeName": "userId", "AttributeType": "S"},
            {"AttributeName": "email", "AttributeType": "S"}
        ],
        gsi=[{
            "IndexName": "EmailIndex",
            "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"}
        }]
    )

    # 2. Markets Table
    create_table(
        f"{PREFIX}-markets",
        [{"AttributeName": "market_id", "KeyType": "HASH"}],
        [
            {"AttributeName": "market_id", "AttributeType": "S"},
            {"AttributeName": "platform", "AttributeType": "S"}
        ],
        gsi=[{
            "IndexName": "PlatformIndex",
            "KeySchema": [{"AttributeName": "platform", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"}
        }]
    )

    # 3. Trades Table
    create_table(
        f"{PREFIX}-trades",
        [{"AttributeName": "trade_id", "KeyType": "HASH"}],
        [
            {"AttributeName": "trade_id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"}
        ],
        gsi=[{
            "IndexName": "UserTradesIndex",
            "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"}
        }]
    )

    # 4. Strategies Table
    create_table(
        f"{PREFIX}-strategies",
        [{"AttributeName": "strategy_id", "KeyType": "HASH"}],
        [
            {"AttributeName": "strategy_id", "AttributeType": "S"},
            {"AttributeName": "user_id", "AttributeType": "S"}
        ],
        gsi=[{
            "IndexName": "UserStrategiesIndex",
            "KeySchema": [{"AttributeName": "user_id", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"}
        }]
    )

    # 5. Subscription Tiers
    create_table(
        f"{PREFIX}-subscription-tiers",
        [{"AttributeName": "tier_id", "KeyType": "HASH"}],
        [{"AttributeName": "tier_id", "AttributeType": "S"}]
    )

    # 6. System Config
    create_table(
        f"{PREFIX}-system-config",
        [{"AttributeName": "config_key", "KeyType": "HASH"}],
        [{"AttributeName": "config_key", "AttributeType": "S"}]
    )

    # 7. Leaderboard Snapshots
    create_table(
        f"{PREFIX}-leaderboard-snapshots",
        [
            {"AttributeName": "snapshot_date", "KeyType": "HASH"},
            {"AttributeName": "timeframe", "KeyType": "RANGE"}
        ],
        [
            {"AttributeName": "snapshot_date", "AttributeType": "S"},
            {"AttributeName": "timeframe", "AttributeType": "S"}
        ]
    )

def seed_data():
    # Wait for tables to be active
    print("Waiting for tables to be active...")
    time.sleep(2)
    
    # Seed Subscription Tiers
    tier_table = dynamodb.Table(f"{PREFIX}-subscription-tiers")
    tiers = [
        {
            "tier_id": "free",
            "name": "Free",
            "price": Decimal("0"),
            "max_capital": Decimal("10000"),
            "slots": 1,
            "features": ["1 trader follow", "Delayed signals (5 minutes)"]
        },
        {
            "tier_id": "pro",
            "name": "Pro",
            "price": Decimal("20"),
            "max_capital": Decimal("50000"),
            "slots": 10,
            "features": ["10 trader slots", "Real-time signals", "AI suggestions"]
        },
        {
            "tier_id": "elite",
            "name": "Elite",
            "price": Decimal("75"),
            "max_capital": Decimal("250000"),
            "slots": 1000,
            "whale_alerts": True,
            "features": ["Unlimited traders", "AI auto-copy", "Whale alerts"]
        }
    ]
    for tier in tiers:
        tier_table.put_item(Item=tier)
    print("Seeded subscription tiers.")

    # Seed System Config
    sys_table = dynamodb.Table(f"{PREFIX}-system-config")
    configs = [
        {"config_key": "default_capital", "config_value": Decimal("50000")},
        {"config_key": "default_tier_id", "config_value": "free"},
        {"config_key": "default_slots", "config_value": 1}
    ]
    for config in configs:
        sys_table.put_item(Item=config)
    print("Seeded system config.")

if __name__ == "__main__":
    setup_tables()
    seed_data()
    print("LocalStack DynamoDB setup complete.")
