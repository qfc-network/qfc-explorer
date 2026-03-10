FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false --network-timeout=600000

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Limit build workers to avoid QEMU SIGILL on arm64 cross-compile
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy Next.js standalone build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy node_modules from deps (not builder) so cache is tied to package-lock
COPY --from=deps /app/node_modules ./node_modules
# Copy src and tsconfig directly from build context to avoid stale COPY --from=builder cache
COPY src ./src
COPY tsconfig.json ./tsconfig.json

# Fail fast at build time if indexer source is missing
RUN test -f src/indexer/index.ts || (echo "ERROR: src/indexer/index.ts not found" && exit 1)

# Create startup script that runs both Next.js and indexer
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'node server.js &' >> /app/start.sh && \
    echo 'sleep 5' >> /app/start.sh && \
    echo 'exec ./node_modules/.bin/tsx src/indexer/index.ts' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000
CMD ["/app/start.sh"]
