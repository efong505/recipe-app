param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("local", "production")]
    [string]$Mode
)

$envFile = "$PSScriptRoot\src\environments\environment.ts"

$localConfig = @"
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
"@

$prodConfig = @"
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.mytestimony.click'
};
"@

switch ($Mode) {
    "local" {
        Set-Content -Path $envFile -Value $localConfig
        Write-Host "`n✅ Switched to LOCAL development" -ForegroundColor Green
        Write-Host "API URL: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "`nStart local server: cd server && npm start" -ForegroundColor Yellow
    }
    "production" {
        Set-Content -Path $envFile -Value $prodConfig
        Write-Host "`n✅ Switched to PRODUCTION API" -ForegroundColor Green
        Write-Host "API URL: https://api.mytestimony.click" -ForegroundColor Cyan
        Write-Host "`nUsing AWS Fargate backend" -ForegroundColor Yellow
    }
}

Write-Host "`nRestart 'ng serve' if already running" -ForegroundColor Gray
