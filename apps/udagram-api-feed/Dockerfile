# Stage 1: Build the feed service
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json turbo.json tsconfig.json ./

# Copy packages and apps directories
COPY packages ./packages
COPY apps/udagram-api-feed ./apps/udagram-api-feed

# Install dependencies (all)
RUN npm ci

# Build the feed service
RUN npx turbo run build --filter=udagram-api-feed

# Stage 2: Run
FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json turbo.json ./

# Copy packages and built app from builder
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/udagram-api-feed/dist ./apps/udagram-api-feed/dist
COPY --from=builder /app/apps/udagram-api-feed/package.json ./apps/udagram-api-feed/package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 8080

# Set working directory to the app
WORKDIR /app/apps/udagram-api-feed

# Run the app
CMD ["node", "dist/server.js"]
