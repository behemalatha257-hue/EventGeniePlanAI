# ===================================================================
# EventGeniePlan AI - Production Docker Container
# Lightweight Node.js Alpine base image with non-root security user
# ===================================================================

FROM node:20-alpine AS base

# Install security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source code
COPY . .

# Create non-root user for security
USER node

# Expose internal port
EXPOSE 4000

# Healthcheck configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start production server
CMD ["node", "server.js"]

