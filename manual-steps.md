# AWS Deployment Guide - Console vs CLI

## Console vs CLI Deployment

### 1. Create IAM Role
**Console:**
1. Go to IAM Console > Roles
2. Create role for Lambda service
3. Attach `AWSLambdaBasicExecutionRole`
4. Name: `recipe-scraper-role`

**CLI (Bash):**
```bash
# Create role
aws iam create-role --role-name recipe-scraper-role --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

# Attach basic execution policy
aws iam attach-role-policy --role-name recipe-scraper-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

**CLI (PowerShell):**
```powershell
# Create role
aws iam create-role --role-name recipe-scraper-role --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

# Attach basic execution policy
aws iam attach-role-policy --role-name recipe-scraper-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### 2. Create DynamoDB Table
**Console:**
1. Go to DynamoDB Console
2. Create table: `WebsiteConfigs`
3. Partition key: `hostname` (String)
4. Use default settings

**CLI (Bash/PowerShell):**
```bash
aws dynamodb create-table --table-name WebsiteConfigs --attribute-definitions AttributeName=hostname,AttributeType=S --key-schema AttributeName=hostname,KeyType=HASH --billing-mode PAY_PER_REQUEST
```

### 3. Create DynamoDB Policy
**Console:**
1. Go to IAM Console > Policies
2. Create policy with DynamoDB read permissions
3. Attach to `recipe-scraper-role`

**CLI (Bash):**
```bash
# Create DynamoDB policy
aws iam create-policy --policy-name recipe-scraper-dynamodb-policy --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["dynamodb:GetItem","dynamodb:Query","dynamodb:Scan"],"Resource":"arn:aws:dynamodb:*:*:table/WebsiteConfigs"}]}'

# Attach to role (replace YOUR_ACCOUNT_ID)
aws iam attach-role-policy --role-name recipe-scraper-role --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/recipe-scraper-dynamodb-policy
```

**CLI (PowerShell):**
```powershell
# Get Account ID
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text

# Create DynamoDB policy
aws iam create-policy --policy-name recipe-scraper-dynamodb-policy --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["dynamodb:GetItem","dynamodb:Query","dynamodb:Scan"],"Resource":"arn:aws:dynamodb:*:*:table/WebsiteConfigs"}]}'

# Attach to role
aws iam attach-role-policy --role-name recipe-scraper-role --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/recipe-scraper-dynamodb-policy"
```

### 4. Create Lambda Function
**Console:**
1. Go to AWS Lambda Console
2. Create function: `recipe-scraper`
3. Runtime: Node.js 18.x
4. Use existing role: `recipe-scraper-role`
5. Upload `scraper-function.zip`

**CLI (Bash):**
```bash
# Create Lambda function (replace YOUR_ACCOUNT_ID)
aws lambda create-function --function-name recipe-scraper --runtime nodejs18.x --role arn:aws:iam::YOUR_ACCOUNT_ID:role/recipe-scraper-role --handler scraper.handler --zip-file fileb://scraper-function-minimal.zip --timeout 30 --memory-size 1024 --environment Variables='{"CONFIG_TABLE_NAME":"WebsiteConfigs"}'
```

**CLI (PowerShell):**
```powershell
# Get Account ID if not already set
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text

# Create Lambda function
aws lambda create-function --function-name recipe-scraper --runtime nodejs18.x --role "arn:aws:iam::$ACCOUNT_ID:role/recipe-scraper-role" --handler scraper.handler --zip-file fileb://scraper-function-minimal.zip --timeout 30 --memory-size 1024 --environment 'Variables={CONFIG_TABLE_NAME=WebsiteConfigs}'
```

### 5. Add Puppeteer Layer
**Console:**
1. In Lambda console, scroll to "Layers"
2. Add layer ARN: `arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:31`

**CLI (Bash/PowerShell):**
```bash
aws lambda update-function-configuration --function-name recipe-scraper --layers arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:31
```

### 6. Create API Gateway
**Console:**
1. Go to API Gateway Console
2. Create REST API: `recipe-scraper-api`
3. Create resource: `/scrape`
4. Create GET method
5. Integration: Lambda Function
6. Deploy to stage

**CLI (Bash):**
```bash
# Create REST API
API_ID=$(aws apigateway create-rest-api --name recipe-scraper-api --query 'id' --output text)

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[0].id' --output text)

# Create /scrape resource
RESOURCE_ID=$(aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part scrape --query 'id' --output text)

# Create GET method
aws apigateway put-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method GET --authorization-type NONE

# Set up Lambda integration (replace YOUR_ACCOUNT_ID and REGION)
aws apigateway put-integration --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method GET --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:REGION:YOUR_ACCOUNT_ID:function:recipe-scraper/invocations

# Deploy API
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod
```

**CLI (PowerShell):**
```powershell
# Get Account ID and Region
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
$REGION = aws configure get region

# Create REST API
$API_ID = aws apigateway create-rest-api --name recipe-scraper-api --query 'id' --output text

# Get root resource ID
$ROOT_ID = aws apigateway get-resources --rest-api-id $API_ID --query 'items[0].id' --output text

# Create /scrape resource
$RESOURCE_ID = aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_ID --path-part scrape --query 'id' --output text

# Create GET method
aws apigateway put-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method GET --authorization-type NONE

# Set up Lambda integration
aws apigateway put-integration --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method GET --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:recipe-scraper/invocations"

# Deploy API
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod
```

### 7. Grant API Gateway Permission
**Console:**
1. This is handled automatically when setting up integration

**CLI (Bash):**
```bash
# Grant API Gateway permission to invoke Lambda (replace YOUR_ACCOUNT_ID and REGION)
aws lambda add-permission --function-name recipe-scraper --statement-id api-gateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:REGION:YOUR_ACCOUNT_ID:$API_ID/*/*"
```

**CLI (PowerShell):**
```powershell
# Grant API Gateway permission (using variables from previous step)
aws lambda add-permission --function-name recipe-scraper --statement-id api-gateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*"
```

### 8. Get API URL
**Console:**
1. In API Gateway console, note the Invoke URL

**CLI (Bash):**
```bash
# Get API URL
echo "https://$API_ID.execute-api.REGION.amazonaws.com/prod"
```

**CLI (PowerShell):**
```powershell
# Get API URL
Write-Host "API URL: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
```

### 9. Populate DynamoDB & Update Frontend
**Both Console & CLI:**
```bash
# Populate DynamoDB
node populate-dynamodb.js WebsiteConfigs

# Update environment file with API URL
# Edit src/environments/environment.prod.ts

# Build Angular app
ng build --configuration production
```

### 10. Get Your Account ID
**CLI (Bash/PowerShell):**
```bash
aws sts get-caller-identity --query Account --output text
```

## Quick CLI Script
Run `aws-cli-deploy.bat` for automated CLI deployment with prompts for account ID.

## Notes
- Replace `YOUR_ACCOUNT_ID` with your actual AWS account ID
- Replace `REGION` with your AWS region (e.g., us-east-1)
- The CLI approach requires more manual variable management
- Console approach is more user-friendly for beginners
