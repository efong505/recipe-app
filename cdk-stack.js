const cdk = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const s3 = require('aws-cdk-lib/aws-s3');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');

class RecipeScraperStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // DynamoDB table for website configurations
    const configTable = new dynamodb.Table(this, 'WebsiteConfigs', {
      partitionKey: { name: 'hostname', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function
    const scraperFunction = new lambda.Function(this, 'ScraperFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'scraper.handler',
      code: lambda.Code.fromAsset('.', {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c',
            'cp package-lambda.json /tmp/package.json && ' +
            'cd /tmp && npm install && ' +
            'cp -r node_modules /asset-output/ && ' +
            'cp /asset-input/scraper.js /asset-output/'
          ],
        },
      }),
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      environment: {
        CONFIG_TABLE_NAME: configTable.tableName,
      },
    });

    configTable.grantReadData(scraperFunction);

    // API Gateway
    const api = new apigateway.RestApi(this, 'ScraperApi', {
      restApiName: 'Recipe Scraper API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type'],
      },
    });

    const scrapeResource = api.root.addResource('scrape');
    scrapeResource.addMethod('GET', new apigateway.LambdaIntegration(scraperFunction, {
      timeout: cdk.Duration.seconds(29),
    }));

    // S3 bucket for frontend
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Deploy Angular build to S3
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./dist/recipe-app')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'ConfigTableName', {
      value: configTable.tableName,
      description: 'DynamoDB Config Table Name',
    });
  }
}

module.exports = { RecipeScraperStack };