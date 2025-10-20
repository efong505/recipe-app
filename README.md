# Recipe & News Scraper

A full-stack web application that scrapes recipes and news articles from various websites using Angular frontend, Node.js backend, and AWS serverless architecture.

## 🚀 Features

- **Recipe Scraping**: Extract recipes from popular cooking websites (Bon Appétit, AllRecipes, etc.)
- **News Scraping**: Extract articles from news websites (Epoch Times, etc.)
- **Multiple Deployment Options**: Local development, AWS Lambda, or AWS Fargate
- **Dynamic Configuration**: Website-specific scraping rules stored in DynamoDB
- **Modern UI**: Angular-based responsive web interface
- **CORS Support**: Cross-origin requests handled properly

## 🏗️ Architecture

### Local Development
```
Angular Frontend (localhost:4200) → Node.js Server (localhost:3000) → Puppeteer → Target Websites
```

### AWS Serverless (Production)
```
CloudFront → S3 (Angular) → API Gateway → Lambda (Puppeteer) → DynamoDB (Config)
```

### AWS Fargate (Alternative)
```
CloudFront → S3 (Angular) → ALB → ECS Fargate (Node.js) → Target Websites
```

## 📁 Project Structure

```
recipe-app/
├── src/                          # Angular frontend
│   ├── app/
│   │   ├── recipe/              # Recipe display component
│   │   ├── search/              # Search component
│   │   └── services/            # HTTP services
│   └── environments/            # Environment configs
├── server/                      # Node.js backend
│   ├── server.js               # Express server
│   ├── browserManager.js       # Puppeteer management
│   └── contentExtractor.js     # Scraping logic
├── lambda-simple/              # Simplified Lambda version
├── cdk-stack.js               # AWS CDK infrastructure
├── scraper.js                 # Lambda function code
├── Dockerfile                 # Container configuration
└── deploy scripts/            # Various deployment options
```

## 🛠️ Technology Stack

**Frontend:**
- Angular 20.3.6
- TypeScript
- RxJS

**Backend:**
- Node.js 18+
- Express.js
- Puppeteer with Stealth plugin
- Cheerio (HTML parsing)

**AWS Services:**
- Lambda (Serverless compute)
- API Gateway (REST API)
- DynamoDB (Configuration storage)
- S3 (Static hosting)
- CloudFront (CDN)
- ECS Fargate (Container hosting)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Angular CLI: `npm install -g @angular/cli`
- AWS CLI (for deployment)
- AWS CDK: `npm install -g aws-cdk`

### Local Development

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd recipe-app
   npm install
   cd server && npm install
   ```

2. **Start Backend Server**
   ```bash
   cd server
   npm start
   # Server runs on http://localhost:3000
   ```

3. **Start Frontend**
   ```bash
   ng serve
   # App runs on http://localhost:4200
   ```

4. **Test Scraping**
   ```bash
   # Test recipe scraping
   curl "http://localhost:3000/scrape?url=https://www.bonappetit.com/recipe/..."
   
   # Test news scraping
   curl "http://localhost:3000/scrape?url=https://www.theepochtimes.com/..."
   ```

## 🌐 Deployment Options

### Option 1: AWS Serverless (Recommended)

1. **Build Angular App**
   ```bash
   ng build --configuration production
   ```

2. **Deploy Infrastructure**
   ```bash
   cdk bootstrap  # First time only
   cdk deploy
   ```

3. **Configure DynamoDB**
   ```bash
   node populate-dynamodb.js <TABLE_NAME_FROM_CDK_OUTPUT>
   ```

4. **Update Frontend Config**
   Update `src/environments/environment.prod.ts` with API Gateway URL from CDK output.

### Option 2: AWS Fargate

1. **Build and Deploy**
   ```bash
   ./deploy-fargate.bat
   ```

### Option 3: Simple Lambda Deployment

1. **Deploy Lambda Function**
   ```bash
   ./simple-deploy.bat
   ```

## 📝 Configuration

### Website Scraping Rules

The application uses DynamoDB to store website-specific scraping configurations:

```json
{
  "hostname": "bonappetit.com",
  "type": "recipe",
  "recipeName": "h1[data-testid='ContentHeaderHed']",
  "description": "div[data-testid='ContentHeaderDek'] p",
  "ingredients": "div[class*='List-'] li",
  "instructions": "div[class*='InstructionsWrapper'] li p"
}
```

### Environment Variables

**Local Development:**
- `PORT`: Server port (default: 3000)

**AWS Lambda:**
- `CONFIG_TABLE_NAME`: DynamoDB table name

### Supported Websites

**Recipes:**
- Bon Appétit (bonappetit.com)
- AllRecipes (allrecipes.com)
- Food Network (foodnetwork.com)

**News:**
- Epoch Times (theepochtimes.com)

## 🔧 Development

### Adding New Websites

1. **Add Configuration to DynamoDB**
   ```javascript
   // In populate-dynamodb.js
   {
     hostname: 'newsite.com',
     type: 'recipe', // or 'news'
     recipeName: 'css-selector-for-title',
     ingredients: 'css-selector-for-ingredients',
     // ... other selectors
   }
   ```

2. **Test Locally**
   ```bash
   curl "http://localhost:3000/scrape?url=https://newsite.com/recipe-url"
   ```

### Running Tests

```bash
# Frontend tests
ng test

# Backend tests
cd server
npm test
```

### Building for Production

```bash
# Build Angular app
ng build --configuration production

# Build Docker image
docker build -t recipe-scraper .
```

## 📊 Monitoring & Debugging

### CloudWatch Logs
- Lambda function logs: `/aws/lambda/ScraperFunction`
- API Gateway logs: Enable in API Gateway console

### Local Debugging
```bash
# Enable debug mode
DEBUG=puppeteer* node server/server.js

# Test specific URL
node server/test_puppeteer.js
```

## 💰 Cost Estimation (AWS)

**Monthly costs for moderate usage (1000 requests/month):**
- Lambda: ~$0.20
- DynamoDB: ~$0.25
- S3: ~$0.50
- CloudFront: ~$1.00
- API Gateway: ~$3.50
- **Total: ~$5.45/month**

## 🔒 Security Considerations

- CORS properly configured
- No sensitive data in client-side code
- Rate limiting implemented
- User-Agent rotation
- Request filtering to avoid tracking scripts

## 🐛 Troubleshooting

### Common Issues

1. **Puppeteer timeout errors**
   - Increase timeout in Lambda configuration
   - Check website's anti-bot measures

2. **CORS errors**
   - Verify API Gateway CORS settings
   - Check environment.prod.ts API URL

3. **DynamoDB access denied**
   - Verify Lambda execution role permissions
   - Check table name in environment variables

### Debug Commands

```bash
# Test Lambda function locally
sam local invoke ScraperFunction --event test-payload.json

# Check CDK diff
cdk diff

# View CloudFormation stack
aws cloudformation describe-stacks --stack-name RecipeScraperStack
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Useful Links

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Angular Documentation](https://angular.io/docs)
- [Cheerio Documentation](https://cheerio.js.org/)