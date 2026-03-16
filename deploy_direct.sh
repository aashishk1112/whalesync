#!/bin/bash
set -e

# Configuration
REGION=$(aws configure get region || echo "us-east-1")
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PREFIX="whalesync"
ROLE_NAME="${PREFIX}-lambda-role"
SECRET_NAME="WhalesyncProdSecrets"
LAMBDA_NAME="${PREFIX}-backend"
API_NAME="${PREFIX}-api"
S3_BUCKET="${PREFIX}-frontend-${ACCOUNT_ID}"

echo "Starting DIRECT AWS CLI Deployment for WhaleSync..."

# 1. Create DynamoDB Tables
echo "Checking/Creating DynamoDB Tables..."
TABLES=("Whalesync-Users" "Whalesync-Markets" "Whalesync-Trades" "Whalesync-Strategies")
for TABLE in "${TABLES[@]}"; do
    if aws dynamodb describe-table --table-name "$TABLE" --region "$REGION" > /dev/null 2>&1; then
        echo "Table $TABLE already exists."
    else
        echo "Creating table $TABLE..."
        # Simplified schemas for CLI creation - adding only keys and necessary GSI
        if [ "$TABLE" == "Whalesync-Users" ]; then
            aws dynamodb create-table --table-name "$TABLE" \
                --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=email,AttributeType=S \
                --key-schema AttributeName=userId,KeyType=HASH \
                --global-secondary-indexes "IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL}" \
                --billing-mode PAY_PER_REQUEST --region "$REGION"
        elif [ "$TABLE" == "Whalesync-Markets" ]; then
             aws dynamodb create-table --table-name "$TABLE" \
                --attribute-definitions AttributeName=market_id,AttributeType=S AttributeName=platform,AttributeType=S \
                --key-schema AttributeName=market_id,KeyType=HASH \
                --global-secondary-indexes "IndexName=PlatformIndex,KeySchema=[{AttributeName=platform,KeyType=HASH}],Projection={ProjectionType=ALL}" \
                --billing-mode PAY_PER_REQUEST --region "$REGION"
        elif [ "$TABLE" == "Whalesync-Trades" ]; then
             aws dynamodb create-table --table-name "$TABLE" \
                --attribute-definitions AttributeName=trade_id,AttributeType=S AttributeName=user_id,AttributeType=S \
                --key-schema AttributeName=trade_id,KeyType=HASH \
                --global-secondary-indexes "IndexName=UserTradesIndex,KeySchema=[{AttributeName=user_id,KeyType=HASH}],Projection={ProjectionType=ALL}" \
                --billing-mode PAY_PER_REQUEST --region "$REGION"
        elif [ "$TABLE" == "Whalesync-Strategies" ]; then
             aws dynamodb create-table --table-name "$TABLE" \
                --attribute-definitions AttributeName=strategy_id,AttributeType=S AttributeName=user_id,AttributeType=S \
                --key-schema AttributeName=strategy_id,KeyType=HASH \
                --global-secondary-indexes "IndexName=UserStrategiesIndex,KeySchema=[{AttributeName=user_id,KeyType=HASH}],Projection={ProjectionType=ALL}" \
                --billing-mode PAY_PER_REQUEST --region "$REGION"
        fi
    fi
done

# 2. Setup Secrets Manager
echo "Checking Secrets Manager..."
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "Secret $SECRET_NAME already exists. Updating values from .env..."
else
    echo "Creating secret $SECRET_NAME..."
    aws secretsmanager create-secret --name "$SECRET_NAME" \
        --description "Production secrets for Whalesync" --region "$REGION"
fi

# Extract values from .env (basic parsing)
get_env_val() {
    grep "^$1=" backend/.env | cut -d'=' -f2-
}

SECRET_JSON=$(cat <<EOF
{
  "POLY_API_KEY": "$(get_env_val POLY_API_KEY)",
  "POLY_API_SECRET": "$(get_env_val POLY_API_SECRET)",
  "POLY_API_PASSPHRASE": "$(get_env_val POLY_API_PASSPHRASE)",
  "POLY_PRIVATE_KEY": "$(get_env_val POLY_PRIVATE_KEY)",
  "STRIPE_SECRET_KEY": "$(get_env_val STRIPE_SECRET_KEY)",
  "STRIPE_WEBHOOK_SECRET": "$(get_env_val STRIPE_WEBHOOK_SECRET)",
  "GOOGLE_CLIENT_ID": "$(get_env_val GOOGLE_CLIENT_ID)",
  "GOOGLE_CLIENT_SECRET": "$(get_env_val GOOGLE_CLIENT_SECRET)",
  "JWT_SECRET": "prod_jwt_secret_$(date +%s)"
}
EOF
)

aws secretsmanager put-secret-value --secret-id "$SECRET_NAME" --secret-string "$SECRET_JSON" --region "$REGION"

# 3. Setup IAM Role for Lambda
echo "Setting up IAM Role..."
if aws iam get-role --role-name "$ROLE_NAME" > /dev/null 2>&1; then
    echo "Role $ROLE_NAME already exists."
else
    cat <<EOF > trust-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    ROLE_ARN=$(aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document file://trust-policy.json --query 'Role.Arn' --output text)
    aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    # Inline policy for DynamoDB and Secrets
    cat <<EOF > lambda-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem",
                "dynamodb:Query", "dynamodb:Scan"
            ],
            "Resource": "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/Whalesync-*"
        },
        {
            "Effect": "Allow",
            "Action": "secretsmanager:GetSecretValue",
            "Resource": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${SECRET_NAME}-*"
        }
    ]
}
EOF
    aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name WhalesyncAccessPolicy --policy-document file://lambda-policy.json
    rm trust-policy.json lambda-policy.json
    echo "Waiting for role to propagate..."
    sleep 10
fi
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

# 4. Package & Deploy Lambda
echo "Packaging Backend..."
rm -rf backend_build backend.zip
mkdir backend_build
# Copy only source files, excluding venv and other junk
rsync -av --exclude 'venv' --exclude '__pycache__' --exclude '.env' --exclude '.git' --exclude 'backend_build' backend/ backend_build/
cd backend_build
python3.11 -m pip install --target . -r requirements.txt --platform manylinux2014_x86_64 --only-binary=:all:
zip -r ../backend.zip .
cd ..

DEPLOY_BUCKET="${PREFIX}-deploys-${ACCOUNT_ID}"
if aws s3 ls "s3://$DEPLOY_BUCKET" > /dev/null 2>&1; then
    echo "Deployment bucket exists."
else
    echo "Creating deployment bucket $DEPLOY_BUCKET..."
    aws s3 mb "s3://$DEPLOY_BUCKET" --region "$REGION"
fi

echo "Uploading backend.zip to S3..."
aws s3 cp backend.zip "s3://$DEPLOY_BUCKET/backend.zip" --region "$REGION"

if aws lambda get-function --function-name "$LAMBDA_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "Updating Lambda code..."
    aws lambda update-function-code --function-name "$LAMBDA_NAME" \
        --s3-bucket "$DEPLOY_BUCKET" --s3-key "backend.zip" --region "$REGION" > /dev/null
else
    echo "Creating Lambda function..."
    aws lambda create-function --function-name "$LAMBDA_NAME" \
        --runtime python3.11 --handler main.handler \
        --role "$ROLE_ARN" \
        --code "S3Bucket=$DEPLOY_BUCKET,S3Key=backend.zip" \
        --environment "Variables={USERS_TABLE=Whalesync-Users,MARKETS_TABLE=Whalesync-Markets,TRADES_TABLE=Whalesync-Trades,STRATEGIES_TABLE=Whalesync-Strategies,MOCK_AUTH=false,PAPER_TRADING=true}" \
        --timeout 30 --memory-size 512 --region "$REGION" > /dev/null
fi

# 5. Create API Gateway (HTTP API)
echo "Setting up API Gateway..."
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'].ApiId" --output text --region "$REGION")
if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
    API_ID=$(aws apigatewayv2 create-api --name "$API_NAME" --protocol-type HTTP --query 'ApiId' --output text --region "$REGION")
fi

LAMBDA_ARN=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query 'Configuration.FunctionArn' --output text --region "$REGION")
INTEGRATION_ID=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --query "Items[?IntegrationUri=='$LAMBDA_ARN'].IntegrationId" --output text --region "$REGION")
if [ -z "$INTEGRATION_ID" ] || [ "$INTEGRATION_ID" == "None" ]; then
    INTEGRATION_ID=$(aws apigatewayv2 create-integration --api-id "$API_ID" --integration-type AWS_PROXY \
        --integration-uri "$LAMBDA_ARN" --payload-format-version 2.0 --query 'IntegrationId' --output text --region "$REGION")
fi

aws apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /{proxy+}" --target "integrations/$INTEGRATION_ID" --region "$REGION" > /dev/null 2>&1 || true
aws apigatewayv2 create-route --api-id "$API_ID" --route-key "ANY /" --target "integrations/$INTEGRATION_ID" --region "$REGION" > /dev/null 2>&1 || true

# Create $default stage if not exists
if ! aws apigatewayv2 get-stage --api-id "$API_ID" --stage-name '$default' --region "$REGION" > /dev/null 2>&1; then
    aws apigatewayv2 create-stage --api-id "$API_ID" --stage-name '$default' --auto-deploy --region "$REGION"
fi

# Add Permission for API to call Lambda
aws lambda add-permission --function-name "$LAMBDA_NAME" \
    --statement-id apigateway-access-$(date +%s) --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" --region "$REGION" > /dev/null 2>&1 || true

API_GW_DOMAIN="${API_ID}.execute-api.${REGION}.amazonaws.com"
echo "Backend API Gateway Domain: $API_GW_DOMAIN"

# 6. Setup S3 Bucket
echo "Setting up S3 Bucket..."
if aws s3 ls "s3://$S3_BUCKET" > /dev/null 2>&1; then
    echo "S3 Bucket $S3_BUCKET already exists."
else
    aws s3 mb "s3://$S3_BUCKET" --region "$REGION"
fi

# Enable Website hosting for direct access (optional but helpful)
aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html --region "$REGION"

# Disable Public Access Block for S3 Website
aws s3api put-public-access-block --bucket "$S3_BUCKET" \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" --region "$REGION"

# Set Bucket Policy
cat <<EOF > bucket-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${S3_BUCKET}/*"
        }
    ]
}
EOF
aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy file://bucket-policy.json --region "$REGION"
rm bucket-policy.json

# 7. Create/Update CloudFront Distribution
echo "Setting up CloudFront Distribution..."
S3_DOMAIN="${S3_BUCKET}.s3-website.${REGION}.amazonaws.com"
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='${PREFIX}-distribution'].Id" --output text)

if [ -z "$DIST_ID" ] || [ "$DIST_ID" == "None" ]; then
    echo "Creating new CloudFront distribution..."
    cat <<EOF > cf-config.json
{
  "CallerReference": "$(date +%s)",
  "Comment": "${PREFIX}-distribution",
  "Enabled": true,
  "Aliases": { "Quantity": 0 },
  "DefaultRootObject": "",
  "OriginGroups": { "Quantity": 0 },
  "Logging": { "Enabled": false, "IncludeCookies": false, "Bucket": "", "Prefix": "" },
  "PriceClass": "PriceClass_All",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true,
    "SSLSupportMethod": "vip",
    "MinimumProtocolVersion": "TLSv1",
    "CertificateSource": "cloudfront"
  },
  "Restrictions": {
    "GeoRestriction": { "RestrictionType": "none", "Quantity": 0 }
  },
  "WebACLId": "",
  "HttpVersion": "http2",
  "IsIPV6Enabled": true,
  "ContinuousDeploymentPolicyId": "",
  "Staging": false,
  "Origins": {
    "Quantity": 2,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "$S3_DOMAIN",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only",
          "OriginSslProtocols": {
            "Quantity": 3,
            "Items": ["TLSv1", "TLSv1.1", "TLSv1.2"]
          }
        }
      },
      {
        "Id": "APIOrigin",
        "DomainName": "$API_GW_DOMAIN",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only",
          "OriginSslProtocols": {
            "Quantity": 3,
            "Items": ["TLSv1", "TLSv1.1", "TLSv1.2"]
          }
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "TrustedSigners": { "Enabled": false, "Quantity": 0 },
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "DefaultTTL": 3600,
    "MaxTTL": 86400
  },
  "CacheBehaviors": {
    "Quantity": 1,
    "Items": [
      {
        "PathPattern": "/api/*",
        "TargetOriginId": "APIOrigin",
        "AllowedMethods": {
          "Quantity": 7,
          "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "ForwardedValues": {
          "QueryString": true,
          "Cookies": { "Forward": "all" },
          "Headers": { 
            "Quantity": 3, 
            "Items": ["Authorization", "Origin", "Content-Type"] 
          }
        },
        "TrustedSigners": { "Enabled": false, "Quantity": 0 },
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "DefaultTTL": 0,
        "MaxTTL": 0
      }
    ]
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}
EOF
    DIST_JSON=$(aws cloudfront create-distribution --distribution-config file://cf-config.json)
    DIST_ID=$(echo "$DIST_JSON" | grep -o '"Id": "[^"]*' | head -1 | cut -d'"' -f4)
    CF_DOMAIN=$(echo "$DIST_JSON" | grep -o '"DomainName": "[^"]*' | head -1 | cut -d'"' -f4)
    rm cf-config.json
else
    echo "CloudFront distribution $DIST_ID already exists. Updating configuration..."
    aws cloudfront get-distribution-config --id "$DIST_ID" --region "$REGION" > cf-config.json
    ETAG=$(jq -r ".ETag" cf-config.json)
    
    # Surgical update using jq to ensure we don't break mandatory fields
    jq "(.DistributionConfig.CacheBehaviors.Items[] | select(.PathPattern == \"/api/*\")) |= (
      .AllowedMethods = {
        \"Quantity\": 7,
        \"Items\": [\"GET\", \"HEAD\", \"OPTIONS\", \"PUT\", \"POST\", \"PATCH\", \"DELETE\"],
        \"CachedMethods\": {
          \"Quantity\": 2,
          \"Items\": [\"GET\", \"HEAD\"]
        }
      } |
      .ForwardedValues.Headers = {
        \"Quantity\": 3,
        \"Items\": [\"Authorization\", \"Origin\", \"Content-Type\"]
      }
    ) | .DistributionConfig.Origins.Items[0].DomainName = \"$S3_DOMAIN\" | .DistributionConfig" cf-config.json > cf-config-update.json

    aws cloudfront update-distribution --id "$DIST_ID" --if-match "$ETAG" --distribution-config file://cf-config-update.json --region "$REGION" > /dev/null
    CF_DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.DomainName' --output text)
    rm cf-config.json cf-config-update.json
fi

echo "CloudFront Domain: $CF_DOMAIN"

# 8. Deploy Frontend
echo "Building Frontend..."
# Point frontend to CloudFront domain for unified API access
cat <<EOF > frontend/.env.production
VITE_API_URL=https://$CF_DOMAIN
EOF
cd frontend && npm install && npm run build && cd ..

echo "Syncing Frontend to S3..."
aws s3 sync frontend/dist "s3://$S3_BUCKET" --delete --region "$REGION"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" --region "$REGION" > /dev/null

echo "Updating Lambda environment with production URL..."
aws lambda update-function-configuration --function-name "$LAMBDA_NAME" \
    --environment "Variables={USERS_TABLE=Whalesync-Users,MARKETS_TABLE=Whalesync-Markets,TRADES_TABLE=Whalesync-Trades,STRATEGIES_TABLE=Whalesync-Strategies,MOCK_AUTH=false,PAPER_TRADING=true,FRONTEND_URL=https://$CF_DOMAIN}" --region "$REGION" > /dev/null

echo "Deployment Complete!"
echo "Global App URL: https://$CF_DOMAIN"
echo "S3 Direct URL: http://$S3_BUCKET.s3-website-$REGION.amazonaws.com"
