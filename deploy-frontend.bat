@echo off
echo Angular Frontend Deployment to AWS
echo ===================================

set BUCKET_NAME=recipe-news-app-frontend
set REGION=us-east-1

echo Step 1: Build Angular app for production...
ng build --configuration production

echo Step 2: Create S3 bucket...
aws s3 mb s3://%BUCKET_NAME% --region %REGION%

echo Step 3: Configure bucket for static website hosting...
aws s3 website s3://%BUCKET_NAME% --index-document index.html --error-document index.html

echo Step 4: Upload files to S3...
aws s3 sync dist/recipe-app s3://%BUCKET_NAME% --delete

echo Step 5: Make bucket public...
aws s3api put-bucket-policy --bucket %BUCKET_NAME% --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"PublicReadGetObject\",\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::%BUCKET_NAME%/*\"}]}"

echo Step 6: Create CloudFront distribution...
aws cloudfront create-distribution --distribution-config "{\"CallerReference\":\"%BUCKET_NAME%-%date:~-4,4%%date:~-10,2%%date:~-7,2%\",\"DefaultRootObject\":\"index.html\",\"Origins\":{\"Quantity\":1,\"Items\":[{\"Id\":\"%BUCKET_NAME%-origin\",\"DomainName\":\"%BUCKET_NAME%.s3.amazonaws.com\",\"S3OriginConfig\":{\"OriginAccessIdentity\":\"\"}}]},\"DefaultCacheBehavior\":{\"TargetOriginId\":\"%BUCKET_NAME%-origin\",\"ViewerProtocolPolicy\":\"redirect-to-https\",\"TrustedSigners\":{\"Enabled\":false,\"Quantity\":0},\"ForwardedValues\":{\"QueryString\":false,\"Cookies\":{\"Forward\":\"none\"}}},\"Comment\":\"Recipe App Frontend\",\"Enabled\":true}"

echo Deployment complete!
echo Website URL: http://%BUCKET_NAME%.s3-website-%REGION%.amazonaws.com
echo CloudFront distribution created (takes 15-20 minutes to deploy)
