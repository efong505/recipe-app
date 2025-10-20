@echo off
echo AWS CLI Deployment Script
echo ========================

echo Getting AWS Account ID...
for /f %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
echo Account ID: %ACCOUNT_ID%

echo Getting AWS Region...
for /f %%i in ('aws configure get region') do set REGION=%%i
echo Region: %REGION%

echo Step 1: Create Lambda execution role...
aws iam create-role --role-name recipe-scraper-role --assume-role-policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"lambda.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}"

echo Step 2: Attach basic execution policy...
aws iam attach-role-policy --role-name recipe-scraper-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

echo Step 3: Create DynamoDB policy...
aws iam create-policy --policy-name recipe-scraper-dynamodb-policy --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"dynamodb:GetItem\",\"dynamodb:Query\",\"dynamodb:Scan\"],\"Resource\":\"arn:aws:dynamodb:*:*:table/WebsiteConfigs\"}]}"

echo Step 4: Attach DynamoDB policy...
aws iam attach-role-policy --role-name recipe-scraper-role --policy-arn arn:aws:iam::%ACCOUNT_ID%:policy/recipe-scraper-dynamodb-policy

echo Step 5: Create DynamoDB table...
aws dynamodb create-table --table-name WebsiteConfigs --attribute-definitions AttributeName=hostname,AttributeType=S --key-schema AttributeName=hostname,KeyType=HASH --billing-mode PAY_PER_REQUEST

echo Step 6: Wait for role propagation (30 seconds)...
timeout /t 30

echo Step 7: Create Lambda function...
aws lambda create-function --function-name recipe-scraper --runtime nodejs18.x --role arn:aws:iam::%ACCOUNT_ID%:role/recipe-scraper-role --handler scraper.handler --zip-file fileb://scraper-function.zip --timeout 30 --memory-size 1024 --environment Variables="{CONFIG_TABLE_NAME=WebsiteConfigs}"

echo Step 8: Add Puppeteer layer...
aws lambda update-function-configuration --function-name recipe-scraper --layers arn:aws:lambda:%REGION%:764866452798:layer:chrome-aws-lambda:31

echo Step 9: Create API Gateway...
for /f %%i in ('aws apigateway create-rest-api --name recipe-scraper-api --query id --output text') do set API_ID=%%i
echo API ID: %API_ID%

echo Step 10: Get root resource ID...
for /f %%i in ('aws apigateway get-resources --rest-api-id %API_ID% --query "items[0].id" --output text') do set ROOT_ID=%%i

echo Step 11: Create /scrape resource...
for /f %%i in ('aws apigateway create-resource --rest-api-id %API_ID% --parent-id %ROOT_ID% --path-part scrape --query id --output text') do set RESOURCE_ID=%%i

echo Step 12: Create GET method...
aws apigateway put-method --rest-api-id %API_ID% --resource-id %RESOURCE_ID% --http-method GET --authorization-type NONE

echo Step 13: Set up Lambda integration...
aws apigateway put-integration --rest-api-id %API_ID% --resource-id %RESOURCE_ID% --http-method GET --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:%REGION%:lambda:path/2015-03-31/functions/arn:aws:lambda:%REGION%:%ACCOUNT_ID%:function:recipe-scraper/invocations

echo Step 14: Grant API Gateway permission...
aws lambda add-permission --function-name recipe-scraper --statement-id api-gateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:%REGION%:%ACCOUNT_ID%:%API_ID%/*/*"

echo Step 15: Deploy API...
aws apigateway create-deployment --rest-api-id %API_ID% --stage-name prod

echo ========================
echo Deployment Complete!
echo API URL: https://%API_ID%.execute-api.%REGION%.amazonaws.com/prod
echo ========================
echo Next steps:
echo 1. Run: node populate-dynamodb.js WebsiteConfigs
echo 2. Update src/environments/environment.prod.ts with API URL
echo 3. Build: ng build --configuration production