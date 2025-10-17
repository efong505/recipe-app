# Manual AWS Deployment Steps

## Option 1: AWS Console Deployment (Recommended)

### 1. Create Lambda Function
1. Go to AWS Lambda Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Function name: `recipe-scraper`
5. Runtime: Node.js 18.x
6. Create function

### 2. Upload Code
1. Run: `simple-deploy.bat` (creates scraper-function.zip)
2. In Lambda console, go to "Code" tab
3. Click "Upload from" > ".zip file"
4. Upload `scraper-function.zip`

### 3. Add Puppeteer Layer
1. In Lambda console, scroll to "Layers"
2. Click "Add a layer"
3. Choose "Specify an ARN"
4. ARN: `arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:31`
5. Click "Add"

### 4. Create DynamoDB Table
1. Go to DynamoDB Console
2. Create table: `WebsiteConfigs`
3. Partition key: `hostname` (String)
4. Use default settings

### 5. Set Environment Variables
1. In Lambda console, go to "Configuration" > "Environment variables"
2. Add: `CONFIG_TABLE_NAME` = `WebsiteConfigs`

### 6. Update IAM Role
Add these policies to Lambda execution role:
- `AWSLambdaBasicExecutionRole`
- DynamoDB read permissions for `WebsiteConfigs` table

### 7. Create API Gateway
1. Go to API Gateway Console
2. Create REST API
3. Create resource `/scrape`
4. Create GET method
5. Integration type: Lambda Function
6. Select your `recipe-scraper` function
7. Deploy API

### 8. Populate DynamoDB
1. Update `populate-dynamodb.js` with your region
2. Run: `node populate-dynamodb.js WebsiteConfigs`

### 9. Update Frontend
1. Get API Gateway URL from console
2. Update `src/environments/environment.prod.ts`
3. Build: `ng build --configuration production`
4. Upload `dist/recipe-app/*` to S3 bucket with static hosting

## Option 2: Continue with CDK
If you want to use CDK, install Docker Desktop first, then run:
```bash
cdk deploy
```