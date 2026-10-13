$ErrorActionPreference = 'Stop'

$bucketName = $env:RECIPE_APP_FRONTEND_BUCKET
$distributionId = $env:RECIPE_APP_CLOUDFRONT_DISTRIBUTION_ID

if ([string]::IsNullOrWhiteSpace($bucketName)) {
    throw 'RECIPE_APP_FRONTEND_BUCKET is not set.'
}

if ([string]::IsNullOrWhiteSpace($distributionId)) {
    throw 'RECIPE_APP_CLOUDFRONT_DISTRIBUTION_ID is not set.'
}

Write-Host "`nDeploying Frontend to AWS..." -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

Write-Host "Building Angular app..." -ForegroundColor Yellow
ng build --configuration production

if ($LASTEXITCODE -ne 0) {
    throw 'Angular build failed.'
}

Write-Host "`nUploading files to S3..." -ForegroundColor Yellow
aws s3 sync dist/recipe-app/browser "s3://$bucketName" --delete

if ($LASTEXITCODE -ne 0) {
    throw 'S3 upload failed.'
}

Write-Host "`nInvalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"

if ($LASTEXITCODE -ne 0) {
    throw 'CloudFront invalidation failed.'
}

Write-Host "`nFrontend deployed successfully." -ForegroundColor Green
Write-Host "CloudFront cache invalidation is in progress." -ForegroundColor Yellow
