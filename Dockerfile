FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
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

# Copy node_modules and src for indexer (tsx needs these)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create startup script that runs both Next.js and indexer
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'node server.js &' >> /app/start.sh && \
    echo 'sleep 5' >> /app/start.sh && \
    echo 'npx tsx src/indexer/index.ts' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000
CMD ["/app/start.sh"]
