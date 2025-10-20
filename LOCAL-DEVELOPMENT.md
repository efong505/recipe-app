# Local Development Guide

## Toggle Between Local and Production

```powershell
# Switch to local development
.\toggle-env.ps1 local

# Switch to production API
.\toggle-env.ps1 production
```

## Quick Start

### 1. Install Chrome for Puppeteer (First Time Only)
```bash
cd server
npx puppeteer browsers install chrome
```

### 2. Start Backend Server
```bash
cd server
npm start
```
Server runs on `http://localhost:3000`

### 3. Start Frontend (New Terminal)
```bash
ng serve
```
App runs on `http://localhost:4200`

## Test Scraping

```bash
# Test recipe
curl "http://localhost:3000/scrape?url=https://www.bonappetit.com/recipe/..."

# Test news
curl "http://localhost:3000/scrape?url=https://www.theepochtimes.com/..."
```

## Architecture

```
Angular (localhost:4200) → Node.js (localhost:3000) → Puppeteer → Target Websites
```

## Notes

- No AWS costs when running locally
- Uses local Puppeteer/Chrome installation
- CORS configured for localhost:4200
- Config stored in `server/config.json`
