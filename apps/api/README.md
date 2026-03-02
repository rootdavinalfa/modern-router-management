# API Server

NestJS-based API server for the Modern Router Management system.

## Prerequisites

- **Node.js**: v18 or higher
- **Package Manager**: Bun v1.3.5 or higher (recommended) or npm v8+
- **Database**: 
  - SQLite (default, no setup required) OR
  - PostgreSQL v14+ (optional, for production deployments)

## Installation

```bash
# From project root
bun install

# Build dependencies (packages/types and packages/drivers)
bun run build:deps
```

## Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Generate an encryption key for router credentials:

```bash
openssl rand -base64 32
```

3. Update `.env` with your configuration:

```bash
# Database (choose one)
DB_ENGINE=sqlite
SQLITE_PATH=./data/dev.sqlite

# OR for PostgreSQL
# DB_ENGINE=postgres
# DATABASE_URL=postgresql://user:password@localhost:5432/router_db

# Encryption key (required)
ROUTER_CREDENTIALS_KEY=<your-generated-key>

# Server port
PORT=3001
```

## Running the Server

```bash
# Development mode with watch
bun run dev

# Production build
bun run build
bun run start:prod

# Debug mode
bun run start:debug
```

## Testing

```bash
# Unit tests
bun run test

# E2E tests
bun run test:e2e

# Test coverage
bun run test:cov
```

## Project Structure

```
src/
├── db/                 # Database configuration and schema
├── routers/            # Router management endpoints
├── crypto/             # Encryption utilities
└── main.ts             # Application entry point
```

## API Endpoints

- `GET /routers` - List all routers
- `GET /routers/active` - Get active router
- `GET /routers/:id/status` - Get router status
- `GET /routers/:id/devices` - Get connected devices
- `POST /routers` - Create new router
- `POST /routers/:id/wifi` - Update WiFi settings
- `POST /routers/:id/reboot` - Reboot router

## Database Migrations

The database schema is managed automatically. On first run, the SQLite database will be created automatically.

## Troubleshooting

### "ROUTER_CREDENTIALS_KEY is not set"
Make sure you've generated and set the encryption key in your `.env` file.

### "Cannot find module '@modern-router-management/types'"
Run `bun run build:deps` from the project root to build the dependencies.

### Database connection errors (PostgreSQL)
- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running: `pg_isready`
- Check database user permissions
