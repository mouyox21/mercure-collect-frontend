# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies before copying source (layer cache: only re-runs on lockfile change)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .

# Accepted values: mock | api-dev | production
ARG BUILD_CONFIGURATION=production
RUN npx ng build --configuration=${BUILD_CONFIGURATION}

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime
# ──────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Patch the main nginx config for non-root operation:
#   - "user nginx;" directive requires master to start as root — remove it
#   - /var/run/nginx.pid is not writable by non-root — redirect to /tmp
RUN sed -i \
        -e 's|^user  nginx;|#user nginx;|' \
        -e 's|/var/run/nginx.pid|/tmp/nginx.pid|' \
        /etc/nginx/nginx.conf

# Angular 17+ outputs browser-facing files in the browser/ subdirectory
COPY --from=builder /app/dist/mercure-collect-frontend/browser /usr/share/nginx/html

# Custom server-block config (SPA routing, gzip, cache headers, /healthz)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fix ownership so the nginx user (uid 101) can read all served files and write cache dirs
RUN chown -R nginx:nginx \
        /var/cache/nginx \
        /usr/share/nginx/html \
        /etc/nginx/conf.d && \
    chmod -R g+rw /var/cache/nginx

# Run as non-root — compatible with Kubernetes and OpenShift restricted policies
USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
