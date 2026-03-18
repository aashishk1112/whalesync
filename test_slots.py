import os
import sys
import pprint

# Setup path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ["ENVIRONMENT"] = "dev"
os.environ["USERS_TABLE"] = "dev-whalesync-users-test"
os.environ["SUBSCRIPTION_TIERS_TABLE"] = "dev-whalesync-tiers-test"

from backend.services.dynamodb_service import create_user, get_user_by_id, add_user_slot, users_table, subscription_tiers_table
import boto3

# Mock tables for testing
dynamodb = boto3.resource('dynamodb', endpoint_url='http://localhost:4566', region_name='ap-south-1')
try:
    dynamodb.create_table(
        TableName="dev-whalesync-users-test",
        KeySchema=[{'AttributeName': 'userId', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'userId', 'AttributeType': 'S'}],
        ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    )
except Exception as e:
    pass

try:
    dynamodb.create_table(
        TableName="dev-whalesync-tiers-test",
        KeySchema=[{'AttributeName': 'tier_id', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'tier_id', 'AttributeType': 'S'}],
        ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    )
except Exception as e:
    pass

try:
    # 1. Test create_user default allocation
    print("Testing create_user default allocation...")
    user = create_user("test1@example.com", "testuser1")
    print("Created user:", user)
    assert user["subscription_tier"] == "pro", "Should default to pro tier"
    assert user["source_slots"] == 10, "Should default to 10 slots"

    # 2. Test add_user_slot
    print("\nTesting add_user_slot...")
    add_user_slot(user["userId"])
    updated_user = get_user_by_id(user["userId"])
    print("Updated user:", updated_user)
    assert updated_user["source_slots"] == 11, "Slots should be incremented to 11"
    print("All tests passed!")
except Exception as e:
    print("Test failed:", e)

