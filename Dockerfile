FROM node:16-alpine

# Install Chromium and dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy package files
COPY server/package.json ./
COPY server/browserManager.js ./
COPY server/contentExtractor.js ./
COPY server/server.js ./
COPY server/config.json ./

# Install dependencies
RUN npm install --production

EXPOSE 3000

CMD ["node", "server.js"]