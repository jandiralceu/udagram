# Stage 1: Build the application
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json turbo.json ./

# Copy packages and apps directories
COPY packages ./packages
COPY apps/udagram-frontend ./apps/udagram-frontend

# Install dependencies
RUN npm ci

# Initialize turbo (optional, if needed for complex builds, but we can often just run npm scripts)
# Build the frontend application
# We use --filter to build only the frontend and its dependencies
RUN npx turbo run build --filter=udagram-frontend

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output from the builder stage
# Standard Vite output directory is dist
COPY --from=builder /app/apps/udagram-frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
