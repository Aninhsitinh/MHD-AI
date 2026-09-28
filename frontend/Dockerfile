# ==============================================================================
# MHD REAL ESTATE TECH • FRONTEND PRODUCTION DOCKERFILE (REACT SPA + NGINX)
# Multi-stage build: Node.js 22 alpine build -> Nginx alpine lightweight server
# ==============================================================================

# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies with clean cache
COPY package*.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean default static assets
RUN rm -rf ./*

# Copy built React assets from builder
COPY --from=builder /app/dist ./

# Copy Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
