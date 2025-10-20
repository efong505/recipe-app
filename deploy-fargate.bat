@echo off
echo Deploying Fargate Stack...
echo ========================

aws cloudformation deploy ^
  --template-file fargate-stack.yaml ^
  --stack-name recipe-scraper-fargate ^
  --capabilities CAPABILITY_IAM ^
  --region us-east-1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Fargate stack deployed successfully!
    echo.
    echo Stack will take 2-3 minutes to fully start.
    echo Check status: aws ecs describe-services --cluster recipe-scraper-cluster --services recipe-scraper-service
) else (
    echo.
    echo ❌ Deployment failed!
)

pause