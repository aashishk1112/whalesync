import os
import boto3
from decimal import Decimal
import uuid

os.environ["DYNAMODB_ENDPOINT"] = "http://localhost:4566"
os.environ["AWS_REGION"] = "ap-south-1"
os.environ["USERS_TABLE"] = "dev-whalesync-users"

dynamodb = boto3.resource("dynamodb", endpoint_url="http://localhost:4566")
users_table = dynamodb.Table("dev-whalesync-users")

user_id = str(uuid.uuid4())
email = "deleted_user@example.com"

users_table.put_item(Item={
    "userId": user_id,
    "user_id": user_id,
    "email": email,
    "username": "Deleted Whale",
    "status": "deleted",
    "last_global_rank": 42,
    "follower_count": 128,
    "simulation_capital": Decimal("50000"),
    "subscription_tier": "pro",
    "created_at": "2026-03-01T00:00:00Z",
    "deleted_at": "2026-03-15T00:00:00Z"
})

print(f"Seeded deleted user: {email}")
