# Fargate Deployment Guide

## Start the Project

```bash
deploy-fargate.bat
```

This will:
- Deploy the CloudFormation stack
- Create ECS cluster, task definition, and service
- Start the Fargate container
- Takes 2-3 minutes to fully start

**Check Status:**
```bash
aws ecs describe-services --cluster recipe-scraper-cluster --services recipe-scraper-service
```

## Stop the Project

```bash
delete-fargate.bat
```

This will:
- Delete the entire CloudFormation stack
- Stop all Fargate containers
- Stop all charges
- Takes 2-3 minutes to fully delete

**Confirm deletion when prompted with `y`**

## Cost Note

Fargate charges by the second while running. Always run `delete-fargate.bat` when not in use to avoid charges.
