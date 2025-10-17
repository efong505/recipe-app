@echo off
echo Simple AWS Lambda deployment...

echo Step 1: Create deployment package...
mkdir lambda-package 2>nul
copy scraper.js lambda-package\
copy package-lambda.json lambda-package\package.json

echo Step 2: Install Lambda dependencies...
cd lambda-package
npm install --production
cd ..

echo Step 3: Create ZIP file...
powershell Compress-Archive -Path lambda-package\* -DestinationPath scraper-function.zip -Force

echo Step 4: Deploy Lambda function...
aws lambda create-function ^
  --function-name recipe-scraper ^
  --runtime nodejs18.x ^
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role ^
  --handler scraper.handler ^
  --zip-file fileb://scraper-function.zip ^
  --timeout 30 ^
  --memory-size 1024

echo Deployment package created: scraper-function.zip
echo Please create IAM role and update the command above with your account details