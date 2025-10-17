# AWS Deployment Guide

## Prerequisites
1. AWS CLI configured with appropriate permissions
2. Node.js 18+ installed
3. AWS CDK installed: `npm install -g aws-cdk`

## Deployment Steps

### 1. Install CDK Dependencies
```bash
npm install aws-cdk-lib constructs
```

### 2. Build Angular App
```bash
ng build --configuration production
```

### 3. Bootstrap CDK (first time only)
```bash
cdk bootstrap
```

### 4. Deploy Infrastructure
```bash
cdk deploy
```

### 5. Populate DynamoDB
After deployment, get the table name from CDK output and run:
```bash
node populate-dynamodb.js <TABLE_NAME>
```

### 6. Update Angular Service
Update the `baseUrl` in `recipe.service.ts` to use the API Gateway URL from CDK output.

## Architecture
- **Frontend**: Angular app hosted on S3 + CloudFront
- **Backend**: AWS Lambda with Puppeteer
- **Database**: DynamoDB for website configurations
- **API**: API Gateway for REST endpoints

## Cost Estimation
- Lambda: ~$0.20 per 1M requests
- DynamoDB: ~$0.25 per GB/month
- S3: ~$0.023 per GB/month
- CloudFront: ~$0.085 per GB transfer
- API Gateway: ~$3.50 per 1M requests

## Monitoring
- CloudWatch logs for Lambda function
- API Gateway metrics
- DynamoDB metrics

## Cleanup
To remove all resources:
```bash
cdk destroy
```