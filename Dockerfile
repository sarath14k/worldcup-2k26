FROM node:22-slim

# Install Chromium and system dependencies required for headless browser scraping
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system-installed Chromium binary
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Build the static frontend build
RUN npm run build

# Expose port 10000 for the Express server (Render default)
EXPOSE 10000

# Start the Express server and scraper daemon
CMD ["node", "server.js"]
