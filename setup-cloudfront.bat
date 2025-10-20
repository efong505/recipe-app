@echo off
echo Setting up CloudFront with Private S3
echo =====================================

set BUCKET_NAME=recipe-news-app-frontend
set REGION=us-east-1

echo Step 1: Block public access to S3...
aws s3api put-public-access-block --bucket %BUCKET_NAME% --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo Step 2: Remove public bucket policy...
aws s3api delete-bucket-policy --bucket %BUCKET_NAME%

echo Step 3: Create Origin Access Control...
aws cloudfront create-origin-access-control --origin-access-control-config "Name=%BUCKET_NAME%-oac,Description=OAC for %BUCKET_NAME%,OriginAccessControlOriginType=s3,SigningBehavior=always,SigningProtocol=sigv4" > oac-output.json

echo Step 4: Create CloudFront distribution...
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json > distribution-output.json

echo Step 5: Get distribution info...
type distribution-output.json | findstr "DomainName"

echo Setup complete! Check distribution-output.json for CloudFront URL
echo Distribution takes 15-20 minutes to deploy