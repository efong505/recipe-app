@echo off
echo Starting AWS deployment with Docker...

@REM echo Step 1: Installing CDK dependencies...
@REM npm install

echo Step 2: Building Angular app...
ng build --configuration production

echo Step 3: Bootstrapping CDK (first time only)...
cdk bootstrap

echo Step 4: Deploying to AWS...
cdk deploy --require-approval never

echo Step 5: Getting outputs...
echo Please note the API Gateway URL and DynamoDB table name from the output above
echo Update src/environments/environment.prod.ts with the API URL
echo Then run: node populate-dynamodb.js [TABLE_NAME]

echo Deployment complete!
