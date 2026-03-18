import boto3
import json
import os
from botocore.exceptions import ClientError

def load_secrets():
    # Only run in production (i.e., not local LocalStack)
    if os.environ.get("DYNAMODB_ENDPOINT"):
        print("[Secrets] Local environment detected, skipping Secrets Manager")
        return

    env = os.environ.get("ENVIRONMENT", "dev")
    secret_name = f"{env}-whalesync-secrets"
    region_name = os.environ.get("AWS_REGION", "ap-south-1")

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        print(f"[Secrets] Fetching secrets from {secret_name}...")
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        print(f"[Secrets] Error fetching secrets: {e}")
        return

    # Decrypts secret using the associated KMS key.
    secret = get_secret_value_response['SecretString']
    secrets_dict = json.loads(secret)

    # Populate os.environ
    for key, value in secrets_dict.items():
        if value and value != "PLACEHOLDER":
            os.environ[key] = str(value)
            # print(f"[Secrets] Loaded {key}") # Avoid printing sensitive keys in logs

    print("[Secrets] Successfully loaded production secrets into environment")
