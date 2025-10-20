@echo off
echo Deploying Lambda Function...
echo ===========================

echo Step 1: Creating Lambda directory...
if exist lambda-deploy rmdir /s /q lambda-deploy
mkdir lambda-deploy
cd lambda-deploy

echo Step 2: Copying Lambda code...
copy ..\lambda-scraper.js index.js
copy ..\lambda-package.json package.json

echo Step 3: Installing dependencies...
npm install --production

echo Step 4: Creating deployment package...
powershell Compress-Archive -Path * -DestinationPath ..\lambda-function.zip -Force
cd ..

echo Step 5: Creating Lambda function...
aws lambda create-function ^
  --function-name recipe-scraper-lambda ^
  --runtime nodejs18.x ^
  --role arn:aws:iam::371751795928:role/lambda-execution-role ^
  --handler index.handler ^
  --zip-file fileb://lambda-function.zip ^
  --timeout 30 ^
  --memory-size 1024 ^
  --region us-east-1

if %ERRORLEVEL% NEQ 0 (
    echo Function might exist, updating...
    aws lambda update-function-code ^
      --function-name recipe-scraper-lambda ^
      --zip-file fileb://lambda-function.zip ^
      --region us-east-1
)

echo Step 6: Creating Lambda target group...
aws elbv2 create-target-group ^
  --name recipe-lambda-targets ^
  --target-type lambda ^
  --region us-east-1

echo Step 7: Getting Lambda ARN...
for /f "tokens=*" %%i in ('aws lambda get-function --function-name recipe-scraper-lambda --query "Configuration.FunctionArn" --output text --region us-east-1') do set LAMBDA_ARN=%%i

echo Step 8: Registering Lambda with target group...
aws elbv2 register-targets ^
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:371751795928:targetgroup/recipe-lambda-targets/XXXXXXXXXX ^
  --targets Id=%LAMBDA_ARN%

echo.
echo ✅ Lambda deployment complete!
echo Function: recipe-scraper-lambda
echo Memory: 1024MB, Timeout: 30s
echo.
echo Next: Update ALB to point to Lambda target group

pause