# Stage 1: Build the user service
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json turbo.json tsconfig.json ./

# Copy packages and apps directories
COPY packages ./packages
COPY apps/udagram-api-user ./apps/udagram-api-user

# Install dependencies (all)
RUN npm ci

# Build the user service
RUN npx turbo run build --filter=udagram-api-user

# Stage 2: Run
FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json turbo.json ./

# Copy packages and built app from builder
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/udagram-api-user/dist ./apps/udagram-api-user/dist
COPY --from=builder /app/apps/udagram-api-user/package.json ./apps/udagram-api-user/package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose port (default from env config is 8080)
EXPOSE 8080

# Set working directory to the app
WORKDIR /app/apps/udagram-api-user

# Run the app
CMD ["node", "dist/server.js"]
