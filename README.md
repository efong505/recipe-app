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
- AWS CLI (for AWS deployment)

### Local Development (Free)

1. **Install Dependencies**
   ```bash
   npm install
   cd server && npm install && npx puppeteer browsers install chrome
   ```

2. **Switch to Local Mode**
   ```powershell
   .\toggle-env.ps1 local
   ```

3. **Start Backend** (Terminal 1)
   ```bash
   cd server
   npm start
   ```

4. **Start Frontend** (Terminal 2)
   ```bash
   ng serve
   ```

5. **Open Browser**
   Navigate to `http://localhost:4200`

📖 **Full guide:** See [LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md)

## 🌐 AWS Fargate Deployment (Recommended)

### Management Commands

```powershell
# Check status and costs
.\manage-fargate.ps1 status
.\manage-fargate.ps1 cost

# Start deployment
.\manage-fargate.ps1 start

# Stop deployment (stops charges)
.\manage-fargate.ps1 stop
```

### Switch Frontend to Production API

```powershell
.\toggle-env.ps1 production
ng serve
```

📖 **Full guide:** See [FARGATE-DEPLOYMENT.md](FARGATE-DEPLOYMENT.md)

### Alternative: AWS Lambda + CDK

```bash
cdk bootstrap  # First time only
cdk deploy
node populate-dynamodb.js <TABLE_NAME>
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

## 📜 Management Scripts

### toggle-env.ps1
Switch between local and production API endpoints:
```powershell
.\toggle-env.ps1 local       # Use localhost:3000
.\toggle-env.ps1 production  # Use AWS Fargate API
```

### manage-fargate.ps1
Manage AWS Fargate deployment:
```powershell
.\manage-fargate.ps1 status  # Check deployment status
.\manage-fargate.ps1 start   # Deploy to AWS
.\manage-fargate.ps1 stop    # Stop and delete (stops charges)
.\manage-fargate.ps1 cost    # View current AWS costs
```

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

## 💰 Cost Monitoring

**Check current AWS costs:**
```powershell
.\manage-fargate.ps1 cost
```

**Estimated Fargate costs:**
- ~$0.01-0.05 per hour while running
- Always stop when not in use: `.\manage-fargate.ps1 stop`

**Local development:** $0 (free)

## 🔒 Security Considerations

- CORS properly configured
- No sensitive data in client-side code
- Rate limiting implemented
- User-Agent rotation
- Request filtering to avoid tracking scripts

## 🐛 Troubleshooting

### Common Issues

1. **Chrome not found (local)**
   ```bash
   cd server
   npx puppeteer browsers install chrome
   ```

2. **Wrong API endpoint**
   ```powershell
   # For local development
   .\toggle-env.ps1 local
   
   # For AWS Fargate
   .\toggle-env.ps1 production
   ```

3. **Fargate not responding**
   ```powershell
   .\manage-fargate.ps1 status
   ```
   Wait 2-3 minutes after starting for tasks to be ready

4. **CORS errors**
   - Verify correct environment with `toggle-env.ps1`
   - Check Fargate is running with `manage-fargate.ps1 status`

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