$bucketName = "recipe-news-app-frontend"
$distributionId = "E12C3H0BU6X6J3"
$region = "us-east-1"

Write-Host "`nDeploying Frontend to AWS..." -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

# Build Angular app
Write-Host "Building Angular app..." -ForegroundColor Yellow
ng build --configuration production

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed!" -ForegroundColor Red
    exit 1
}



# Upload files to S3
Write-Host "`nUploading files to S3..." -ForegroundColor Yellow
aws s3 sync dist/recipe-app/browser "s3://$bucketName" --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ S3 upload failed!" -ForegroundColor Red
    exit 1
}

# Invalidate CloudFront cache
Write-Host "`nInvalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Frontend deployed successfully!" -ForegroundColor Green
    Write-Host "`nCloudFront URL: https://$distributionId.cloudfront.net" -ForegroundColor Cyan
    Write-Host "Cache invalidation in progress (takes 1-2 minutes)" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ CloudFront invalidation failed!" -ForegroundColor Red
}
