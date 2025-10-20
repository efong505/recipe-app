@echo off
echo Setting up ALB with HTTPS for Fargate
echo =====================================

set VPC_ID=vpc-08b1180af82b40b0d
set SUBNET1=subnet-06a2ecf732dbe5b92
set SUBNET2=subnet-0123456789abcdef0
set SECURITY_GROUP=sg-057232ebfc458bae2

echo Step 1: Create ALB...
aws elbv2 create-load-balancer --name recipe-scraper-alb --subnets %SUBNET1% %SUBNET2% --security-groups %SECURITY_GROUP% --scheme internet-facing --type application --ip-address-type ipv4

echo Step 2: Create target group...
aws elbv2 create-target-group --name recipe-scraper-targets --protocol HTTP --port 3000 --vpc-id %VPC_ID% --target-type ip --health-check-path /scrape

echo Step 3: Register Fargate task with target group...
aws elbv2 register-targets --target-group-arn TARGET_GROUP_ARN --targets Id=54.144.85.136,Port=3000

echo Step 4: Create listener...
aws elbv2 create-listener --load-balancer-arn LOAD_BALANCER_ARN --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=TARGET_GROUP_ARN

echo ALB setup complete!
echo Update your Angular app to use the ALB DNS name