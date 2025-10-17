#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { RecipeScraperStack } = require('./cdk-stack');

const app = new cdk.App();
new RecipeScraperStack(app, 'RecipeScraperStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();