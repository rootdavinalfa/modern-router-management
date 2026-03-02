# Multi-stage optimized Dockerfile for Modern Router Management API
# Uses monorepo workspace structure for proper dependency resolution

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
COPY packages/types/package.json ./packages/types/
COPY packages/drivers/package.json ./packages/drivers/

# Copy source files
COPY packages/types/tsconfig.json packages/types/tsconfig.build.json ./packages/types/
COPY packages/types/src/ ./packages/types/src/
COPY packages/drivers/tsconfig.json ./packages/drivers/
COPY packages/drivers/src/ ./packages/drivers/src/
COPY apps/api/nest-cli.json apps/api/tsconfig.build.json apps/api/tsconfig.json ./apps/api/
COPY apps/api/src/ ./apps/api/src/

# Install all dependencies (including dev for building)
RUN bun install

# Build all packages in order
RUN cd packages/types && bun run build
RUN cd packages/drivers && bun run build
RUN cd packages/drivers && bunx playwright install chromium --with-deps
RUN cd apps/api && bun run build

# Production stage
FROM oven/bun:1.2.21-slim AS production
WORKDIR /app

# Install runtime dependencies including Playwright Chromium deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libatspi2.0-0 \
    libgstreamer1.0-0 libgstreamer-gl1.0-0 libgtk-3-0 libegl1 \
    libglx0 libx11-xcb1 libxcb-dri3-0 && \
    rm -rf /var/lib/apt/lists/*

# Copy package manifests for production install
COPY package.json bun.lock* ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/drivers/package.json ./packages/drivers/

# Install production dependencies only (workspaces will link local packages)
RUN bun install --production

# Copy built artifacts from builder
COPY --from=builder /build/apps/api/dist ./apps/api/dist
COPY --from=builder /build/packages/types/dist ./packages/types/dist
COPY --from=builder /build/packages/drivers/dist ./packages/drivers/dist
COPY --from=builder /root/.cache/ms-playwright ./ms-playwright

# Set Playwright browsers path
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Create data directory and set permissions
RUN mkdir -p /app/data && chown -R bun:bun /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_ENGINE=postgres

USER bun

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD bun run -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" || exit 1

CMD ["bun", "run", "apps/api/dist/main.js"]
