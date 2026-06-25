# ---- Stage 1: Build ----
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies first (leverages Docker layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build the frontend
COPY . .
RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-slim

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser -m appuser

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy only the server files needed at runtime
COPY server.js ./
COPY scripts/ ./scripts/
COPY public/ ./public/
COPY index.html ./
COPY src/data/ ./src/data/

# Set ownership to non-root user
RUN chown -R appuser:appuser /app

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:10000/').then(r => {if(!r.ok) throw r.status}).catch(() => process.exit(1))"

# Switch to non-root user
USER appuser

# Expose port 10000 for the Express server (Render default)
EXPOSE 10000

# Start the Express server and scraper daemon
CMD ["node", "server.js"]
