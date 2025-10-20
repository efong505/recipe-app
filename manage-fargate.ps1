param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("status", "start", "stop", "cost")]
    [string]$Action
)

$stackName = "recipe-scraper-fargate"
$clusterName = "recipe-scraper-cluster"
$serviceName = "recipe-scraper-service"
$region = "us-east-1"

function Get-Status {
    Write-Host "`nChecking Fargate Status..." -ForegroundColor Cyan
    Write-Host "========================`n" -ForegroundColor Cyan
    
    $stack = aws cloudformation describe-stacks --stack-name $stackName --region $region 2>$null | ConvertFrom-Json
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Stack not found - Project is STOPPED" -ForegroundColor Red
        return
    }
    
    $stackStatus = $stack.Stacks[0].StackStatus
    
    switch -Wildcard ($stackStatus) {
        "*_IN_PROGRESS" {
            Write-Host "⏳ Deployment in progress..." -ForegroundColor Yellow
            Write-Host "CloudFormation Status: $stackStatus" -ForegroundColor Gray
        }
        "CREATE_COMPLETE" {
            Write-Host "✅ Stack deployed successfully" -ForegroundColor Green
            Write-Host "CloudFormation Status: $stackStatus" -ForegroundColor Gray
            
            $service = aws ecs describe-services --cluster $clusterName --services $serviceName --region $region | ConvertFrom-Json
            $runningCount = $service.services[0].runningCount
            $desiredCount = $service.services[0].desiredCount
            $status = $service.services[0].status
            
            Write-Host "Service Status: $status" -ForegroundColor Cyan
            Write-Host "Running Tasks: $runningCount / $desiredCount" -ForegroundColor Cyan
            
            if ($runningCount -gt 0) {
                $tasks = aws ecs list-tasks --cluster $clusterName --service-name $serviceName --region $region | ConvertFrom-Json
                if ($tasks.taskArns.Count -gt 0) {
                    $taskDetails = aws ecs describe-tasks --cluster $clusterName --tasks $tasks.taskArns[0] --region $region | ConvertFrom-Json
                    $taskStatus = $taskDetails.tasks[0].lastStatus
                    Write-Host "Task Status: $taskStatus" -ForegroundColor Cyan
                }
                Write-Host "`n✅ Project is RUNNING and accepting requests" -ForegroundColor Green
            } else {
                Write-Host "`n⏳ Project is starting up (wait 1-2 minutes)..." -ForegroundColor Yellow
            }
        }
        "UPDATE_COMPLETE" {
            Write-Host "✅ Stack updated successfully" -ForegroundColor Green
            Write-Host "CloudFormation Status: $stackStatus" -ForegroundColor Gray
            
            $service = aws ecs describe-services --cluster $clusterName --services $serviceName --region $region | ConvertFrom-Json
            $runningCount = $service.services[0].runningCount
            $desiredCount = $service.services[0].desiredCount
            $status = $service.services[0].status
            
            Write-Host "Service Status: $status" -ForegroundColor Cyan
            Write-Host "Running Tasks: $runningCount / $desiredCount" -ForegroundColor Cyan
            
            if ($runningCount -gt 0) {
                Write-Host "`n✅ Project is RUNNING and accepting requests" -ForegroundColor Green
            } else {
                Write-Host "`n⏳ Project is starting up (wait 1-2 minutes)..." -ForegroundColor Yellow
            }
        }
        "ROLLBACK_COMPLETE" {
            Write-Host "⚠️  Previous deployment failed and rolled back" -ForegroundColor Yellow
            Write-Host "CloudFormation Status: $stackStatus" -ForegroundColor Gray
            Write-Host "`nThe stack is running the PREVIOUS working version." -ForegroundColor Yellow
            
            $service = aws ecs describe-services --cluster $clusterName --services $serviceName --region $region 2>$null | ConvertFrom-Json
            if ($service) {
                $runningCount = $service.services[0].runningCount
                $desiredCount = $service.services[0].desiredCount
                Write-Host "Running Tasks: $runningCount / $desiredCount" -ForegroundColor Cyan
                
                if ($runningCount -gt 0) {
                    Write-Host "`n✅ Service is still RUNNING (old version)" -ForegroundColor Green
                }
            }
        }
        "*_FAILED" {
            Write-Host "❌ Deployment failed" -ForegroundColor Red
            Write-Host "CloudFormation Status: $stackStatus" -ForegroundColor Gray
        }
        "ROLLBACK_IN_PROGRESS" {
            Write-Host "⏳ Rolling back failed deployment..." -ForegroundColor Yellow
            Write-Host "CloudFormation Status: $stackStatus" -ForegroundColor Gray
        }
        default {
            Write-Host "CloudFormation Status: $stackStatus" -ForegroundColor Yellow
        }
    }
}

function Start-Project {
    Write-Host "`nStarting Fargate Project..." -ForegroundColor Cyan
    Write-Host "========================`n" -ForegroundColor Cyan
    
    & "$PSScriptRoot\deploy-fargate.bat"
}

function Stop-Project {
    Write-Host "`nStopping Fargate Project..." -ForegroundColor Cyan
    Write-Host "========================`n" -ForegroundColor Cyan
    
    $confirm = Read-Host "This will stop all Fargate charges. Are you sure? (y/N)"
    
    if ($confirm -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        return
    }
    
    aws cloudformation delete-stack --stack-name $stackName --region $region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Fargate stack deletion initiated!" -ForegroundColor Green
        Write-Host "Stack will take 2-3 minutes to fully delete." -ForegroundColor Yellow
        Write-Host "💰 Fargate charges stopped!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Deletion failed!" -ForegroundColor Red
    }
}

function Get-Cost {
    Write-Host "`nChecking AWS Costs..." -ForegroundColor Cyan
    Write-Host "========================`n" -ForegroundColor Cyan
    
    $tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    $today = Get-Date -Format "yyyy-MM-dd"
    $startOfMonth = (Get-Date -Day 1).ToString("yyyy-MM-dd")
    
    Write-Host "ECS Fargate costs (Month-to-Date):" -ForegroundColor Yellow
    $ecsCost = aws ce get-cost-and-usage `
        --time-period Start=$startOfMonth,End=$tomorrow `
        --granularity MONTHLY `
        --metrics UnblendedCost `
        --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Elastic Container Service"]}}' `
        --query 'ResultsByTime[0].Total.UnblendedCost.[Amount,Unit]' `
        --output text
    
    if ($ecsCost) {
        $parts = $ecsCost -split '\s+'
        $amount = [math]::Round([decimal]$parts[0], 2)
        Write-Host "  $$amount $($parts[1])" -ForegroundColor Green
    } else {
        Write-Host "  $0.00 USD" -ForegroundColor Green
    }
    
    Write-Host "`nTotal AWS costs (This Month):" -ForegroundColor Yellow
    $totalCost = aws ce get-cost-and-usage `
        --time-period Start=$startOfMonth,End=$tomorrow `
        --granularity MONTHLY `
        --metrics UnblendedCost `
        --query 'ResultsByTime[0].Total.UnblendedCost.[Amount,Unit]' `
        --output text
    
    if ($totalCost) {
        $parts = $totalCost -split '\s+'
        $amount = [math]::Round([decimal]$parts[0], 2)
        Write-Host "  $$amount $($parts[1])" -ForegroundColor Green
    } else {
        Write-Host "  $0.00 USD" -ForegroundColor Green
    }
    
    Write-Host "`n💡 View detailed breakdown: https://console.aws.amazon.com/cost-management/home#/cost-explorer" -ForegroundColor Cyan
    Write-Host "⚠️  Note: Cost data may have 24-hour delay" -ForegroundColor Yellow
}

switch ($Action) {
    "status" { Get-Status }
    "start"  { Start-Project }
    "stop"   { Stop-Project }
    "cost"   { Get-Cost }
}
