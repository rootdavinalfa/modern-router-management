# Multi-stage optimized Dockerfile for Modern Router Management
# Includes both API server and TanStack Start frontend

# Build stage - compile all packages
FROM oven/bun:1.2.21 AS builder
WORKDIR /build

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy root package files for workspace setup
COPY package.json bun.lock* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/drivers/package.json ./packages/drivers/
COPY packages/ui/package.json ./packages/ui/

# Copy source files
COPY packages/types/tsconfig.json packages/types/tsconfig.build.json ./packages/types/
COPY packages/types/src/ ./packages/types/src/
COPY packages/drivers/tsconfig.json ./packages/drivers/
COPY packages/drivers/src/ ./packages/drivers/src/
COPY packages/ui/src/ ./packages/ui/src/
COPY apps/api/nest-cli.json apps/api/tsconfig.build.json apps/api/tsconfig.json ./apps/api/
COPY apps/api/src/ ./apps/api/src/
COPY apps/web/tsconfig.json apps/web/vite.config.ts ./apps/web/
COPY apps/web/src/ ./apps/web/src/

# Install all dependencies (including dev for building)
RUN bun install

# Build all packages in order
RUN cd packages/types && bun run build
RUN cd packages/drivers && bun run build
RUN cd packages/drivers && bunx playwright install chromium --with-deps
RUN cd apps/api && bun run build
RUN cd apps/web && bun run build

# Production stage
FROM oven/bun:1.2.21-slim AS production
WORKDIR /app

# Install runtime dependencies including Playwright Chromium deps and build tools for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libatspi2.0-0 \
    libgstreamer1.0-0 libgstreamer-gl1.0-0 libgtk-3-0 libegl1 \
    libglx0 libx11-xcb1 libxcb-dri3-0 \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy built artifacts from builder
COPY --from=builder /build/apps/api/dist ./apps/api/dist
COPY --from=builder /build/packages/types/dist ./packages/types/dist
COPY --from=builder /build/packages/drivers/dist ./packages/drivers/dist
COPY --from=builder /build/apps/web/dist ./apps/web/dist
COPY --from=builder /root/.cache/ms-playwright ./ms-playwright

# Copy package manifests and install dependencies
COPY package.json bun.lock* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/drivers/package.json ./packages/drivers/
COPY packages/ui/package.json ./packages/ui/
COPY packages/ui/src ./packages/ui/src

# Install dependencies (workspaces will link local packages)
RUN bun install

# Set Playwright browsers path
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Create data directory and set permissions
RUN mkdir -p /app/data && chown -R bun:bun /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_ENGINE=postgres

USER bun

EXPOSE 3001
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD bun run -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" || exit 1

# Start both API and TanStack Start server
CMD ["sh", "-c", "bun run apps/api/dist/main.js & PORT=3000 bun run apps/web/dist/server/server.js"]
