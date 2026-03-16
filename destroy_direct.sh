#!/bin/bash
# destroy_direct.sh - Deletes all resources created by deploy_direct.sh
# WARNING: This will permanently delete your data and infrastructure.

set -e

# Configuration (Mirrored from deploy_direct.sh)
REGION=$(aws configure get region || echo "us-east-1")
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PREFIX="whalesync"
ROLE_NAME="${PREFIX}-lambda-role"
SECRET_NAME="WhalesyncProdSecrets"
LAMBDA_NAME="${PREFIX}-backend"
API_NAME="${PREFIX}-api"
S3_BUCKET="${PREFIX}-frontend-${ACCOUNT_ID}"
DEPLOY_BUCKET="${PREFIX}-deploys-${ACCOUNT_ID}"

echo "Starting cleanup of WhaleSync AWS resources..."

# 1. CloudFront Distribution
echo "Checking for CloudFront Distribution..."
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='${PREFIX}-distribution'].Id" --output text)

if [ -n "$DIST_ID" ] && [ "$DIST_ID" != "None" ]; then
    DIST_STATUS=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.Status' --output text)
    DIST_ENABLED=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.DistributionConfig.Enabled' --output text)

    if [ "$DIST_ENABLED" == "true" ]; then
        echo "CloudFront Distribution $DIST_ID is enabled. Disabling it now..."
        aws cloudfront get-distribution-config --id "$DIST_ID" > cf-config.json
        ETAG=$(jq -r ".ETag" cf-config.json)
        jq ".DistributionConfig.Enabled = false" cf-config.json > cf-config-disabled.json
        aws cloudfront update-distribution --id "$DIST_ID" --if-match "$ETAG" --distribution-config file://cf-config-disabled.json > /dev/null
        rm cf-config.json cf-config-disabled.json
        echo "CloudFront distribution is disabling. Note: It must be 'Deployed' before it can be deleted (takes ~5-15 mins)."
        echo "Please run: aws cloudfront delete-distribution --id $DIST_ID --if-match <NEW_ETAG> later."
    elif [ "$DIST_STATUS" == "Deployed" ]; then
        echo "CloudFront Distribution $DIST_ID is disabled and deployed. Deleting..."
        ETAG=$(aws cloudfront get-distribution-config --id "$DIST_ID" --query 'ETag' --output text)
        aws cloudfront delete-distribution --id "$DIST_ID" --if-match "$ETAG"
    else
        echo "CloudFront Distribution $DIST_ID is still $DIST_STATUS. Skipping deletion for now."
    fi
else
    echo "No CloudFront distribution found."
fi

# 2. API Gateway
echo "Cleaning up API Gateway..."
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'].ApiId" --output text --region "$REGION")
if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    echo "Deleting API Gateway $API_ID..."
    aws apigatewayv2 delete-api --api-id "$API_ID" --region "$REGION"
fi

# 3. Lambda Function
echo "Cleaning up Lambda Function..."
if aws lambda get-function --function-name "$LAMBDA_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "Deleting Lambda $LAMBDA_NAME..."
    aws lambda delete-function --function-name "$LAMBDA_NAME" --region "$REGION"
fi

# 4. S3 Buckets
echo "Cleaning up S3 Buckets..."
BUCKETS=("$S3_BUCKET" "$DEPLOY_BUCKET")
for BUCKET in "${BUCKETS[@]}"; do
    if aws s3 ls "s3://$BUCKET" > /dev/null 2>&1; then
        echo "Emptying and deleting bucket $BUCKET..."
        aws s3 rm "s3://$BUCKET" --recursive
        aws s3 rb "s3://$BUCKET" --force
    fi
done

# 5. IAM Role
echo "Cleaning up IAM Role..."
if aws iam get-role --role-name "$ROLE_NAME" > /dev/null 2>&1; then
    echo "Detaching policies and deleting role $ROLE_NAME..."
    aws iam detach-role-policy --role-name "$ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole || true
    aws iam delete-role-policy --role-name "$ROLE_NAME" --policy-name WhalesyncAccessPolicy || true
    aws iam delete-role --role-name "$ROLE_NAME"
fi

# 6. Secrets Manager
echo "Cleaning up Secret..."
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "Deleting secret $SECRET_NAME..."
    aws secretsmanager delete-secret --secret-id "$SECRET_NAME" --force-delete-without-recovery --region "$REGION"
fi

# 7. DynamoDB Tables
echo "Cleaning up DynamoDB Tables..."
TABLES=("Whalesync-Users" "Whalesync-Markets" "Whalesync-Trades" "Whalesync-Strategies")
for TABLE in "${TABLES[@]}"; do
    if aws dynamodb describe-table --table-name "$TABLE" --region "$REGION" > /dev/null 2>&1; then
        echo "Deleting table $TABLE..."
        aws dynamodb delete-table --table-name "$TABLE" --region "$REGION"
    fi
done

echo "Cleanup process initiated."
echo "Note: If you disabled a CloudFront distribution, remember to delete it manually once it reaches the 'Deployed' status."
