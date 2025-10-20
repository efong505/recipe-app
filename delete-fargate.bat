@echo off
echo Deleting Fargate Stack...
echo ========================

echo This will stop all Fargate charges.
set /p confirm="Are you sure? (y/N): "

if /i "%confirm%" NEQ "y" (
    echo Cancelled.
    pause
    exit /b
)

aws cloudformation delete-stack ^
  --stack-name recipe-scraper-fargate ^
  --region us-east-1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Fargate stack deletion initiated!
    echo.
    echo Stack will take 2-3 minutes to fully delete.
    echo Check status: aws cloudformation describe-stacks --stack-name recipe-scraper-fargate
    echo.
    echo 💰 Fargate charges stopped!
) else (
    echo.
    echo ❌ Deletion failed!
)

pause