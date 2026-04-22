# syntax=docker/dockerfile:1

############################
# Builder stage
############################
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --progress=false

COPY . .
RUN npm run build

############################
# Runtime stage (nginx)
############################
FROM nginx:stable-alpine

# curl for healthcheck
RUN apk add --no-cache curl

# Remove the default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -fsS --max-time 3 http://127.0.0.1:3000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
