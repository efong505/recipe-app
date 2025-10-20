# Fargate Deployment Guide

## Quick Commands (PowerShell)

```powershell
# Check status
.\manage-fargate.ps1 status

# Start project
.\manage-fargate.ps1 start

# Stop project
.\manage-fargate.ps1 stop

# Check costs
.\manage-fargate.ps1 cost
```

## Manual Commands

### Start the Project

```bash
deploy-fargate.bat
```

This will:
- Deploy the CloudFormation stack
- Create ECS cluster, task definition, and service
- Start the Fargate container
- Takes 2-3 minutes to fully start

### Stop the Project

```bash
delete-fargate.bat
```

This will:
- Delete the entire CloudFormation stack
- Stop all Fargate containers
- Stop all charges
- Takes 2-3 minutes to fully delete

**Confirm deletion when prompted with `y`**

## Cost Monitoring

Fargate charges by the second while running. Always run `delete-fargate.bat` when not in use to avoid charges.

**Check current costs:**
```powershell
.\manage-fargate.ps1 cost
```

This shows:
- ECS Fargate costs (month-to-date)
- Total AWS costs (today)
- Link to AWS Cost Explorer for detailed breakdown
