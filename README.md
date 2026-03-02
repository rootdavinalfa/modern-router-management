# Modern Router Management

A full-stack web application for managing and monitoring ZTE fiber routers (ONT/ONU devices). Built with a monorepo architecture using Turborepo, featuring a NestJS API server and a TanStack React web client.

## Features

- **Real-time Monitoring**: View router status, optical power levels, and connection metrics
- **PON Optical Module**: Monitor RX/TX power, temperature, voltage, and ONU state
- **WAN Connections**: Track all WAN connections with IPv4/IPv6 support
- **Multi-Router Support**: Manage multiple routers from a single dashboard
- **Secure Storage**: Encrypted credential storage using AES-256-GCM
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS

## Project Structure

```
modern-router-management/
├── apps/
│   ├── api/              # NestJS API server
│   └── web/              # TanStack React web client
├── packages/
│   ├── types/            # Shared TypeScript types and Zod schemas
│   ├── drivers/          # Router driver implementations (Playwright)
│   └── ui/               # Shared UI components
├── docs/                 # Documentation
└── turbo.json            # Turborepo configuration
```

## Tech Stack

### Frontend (Web)
- **Framework**: TanStack React Start
- **Routing**: TanStack Router (file-based)
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query
- **State Management**: React Context + TanStack Query

### Backend (API)
- **Framework**: NestJS
- **Database**: SQLite (default) or PostgreSQL
- **ORM**: Drizzle ORM
- **Encryption**: Node.js Crypto (AES-256-GCM)
- **Validation**: Zod

### Infrastructure
- **Monorepo**: Turborepo
- **Package Manager**: Bun
- **Browser Automation**: Playwright

## Prerequisites

- **Node.js**: v18 or higher
- **Bun**: v1.3.5 or higher
- **Database**: SQLite (bundled) or PostgreSQL v14+ (optional)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd modern-router-management
bun install
```

### 2. Configure Environment

**API Server:**
```bash
cd apps/api
cp .env.example .env

# Generate encryption key
openssl rand -base64 32

# Edit .env and add the generated key to ROUTER_CREDENTIALS_KEY
```

**Web Client:**
```bash
cd apps/web
cp .env.example .env.local
```

### 3. Run the Application

**Option A: Run everything together (from root)**
```bash
# Terminal 1: Start API server
bun run dev:api

# Terminal 2: Start web client
bun run dev:web
```

**Option B: Run specific apps**
```bash
# API only
cd apps/api && bun run dev

# Web only
cd apps/web && bun run dev
```

### 4. Access the Application

- **Web Client**: http://localhost:3000
- **API Server**: http://localhost:3001

## Available Commands

### Root Level

```bash
bun run build          # Build all packages
bun run dev            # Run all apps in dev mode
bun run dev:web        # Run web client only
bun run dev:api        # Run API server only
bun run lint           # Lint all packages
bun run format         # Format all code
bun run check-types    # Type check all packages
bun run clean          # Clean all build artifacts
```

### Package Level

Each package has its own scripts. See individual READMEs:
- [`apps/api/README.md`](apps/api/README.md) - API server documentation
- [`apps/web/README.md`](apps/web/README.md) - Web client documentation

## Supported Routers

- **ZTE F6600P** - Full support (PON metrics, WAN status, connected devices)

More router models coming soon!

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/routers` | List all routers |
| GET | `/routers/active` | Get active router |
| GET | `/routers/:id/status` | Get router status |
| GET | `/routers/:id/devices` | Get connected devices |
| POST | `/routers` | Add new router |
| POST | `/routers/:id/wifi` | Update WiFi settings |
| POST | `/routers/:id/reboot` | Reboot router |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Web UI    │────▶│   API Server │────▶│  Router Driver  │
│  (React)    │     │   (NestJS)   │     │  (Playwright)   │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Database   │
                    │ (SQLite/PG)  │
                    └──────────────┘
```

## Security

- Router credentials are encrypted using AES-256-GCM before storage
- Encryption key must be provided via environment variable
- No plaintext passwords stored in database

## Development

### Building Packages

```bash
# Build all packages
bun run build

# Build specific package
bun run build:types
bun run build:drivers
bun run build:api
bun run build:web
```

### Testing

```bash
# Run all tests
bun run test

# Run E2E tests
bun run test:e2e
```

### Code Quality

```bash
# Lint and format
bun run lint
bun run format

# Fix issues automatically
bun run lint:fix
bun run check
```

## Troubleshooting

### API won't start
- Check that `.env` file exists in `apps/api/`
- Verify `ROUTER_CREDENTIALS_KEY` is set and valid (32 bytes base64)
- Ensure port 3001 is not in use

### Web can't connect to API
- Verify API server is running
- Check `VITE_API_URL` in `apps/web/.env.local`
- Check for CORS issues in browser console

### Build errors
```bash
# Clean and reinstall
bun run clean
bun install

# Rebuild dependencies
cd apps/api && bun run build:deps
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Docker Deployment

### Prerequisites

- **Podman** or **Docker** installed
- **PostgreSQL** (optional, can run in container)

### Build the Image

```bash
# Build production image (includes both API and TanStack Start frontend)
podman build -t modern-router-app:latest --target production .

# The build includes:
# - TypeScript compilation for all packages
# - Playwright Chromium browser installation
# - TanStack Start SSR server build
# - Production dependencies only
```

### Run with Docker Compose (Recommended)

```bash
# Start PostgreSQL and App together
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop everything
docker-compose down
```

Access the application at **http://localhost:3000** (TanStack Start frontend) and **http://localhost:3001** (API).

### Run Manually

**1. Start PostgreSQL:**
```bash
podman run -d --name modern-router-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=12345678 \
  -e POSTGRES_DB=modern_router_mgmt \
  -p 5432:5432 \
  postgres:16-alpine
```

**2. Generate Encryption Key:**
```bash
openssl rand -base64 32
```

**3. Create Environment File:**
```bash
cat > .env.docker << EOF
NODE_ENV=production
PORT=3001
DB_ENGINE=postgres
DATABASE_URL=postgresql://postgres:12345678@localhost:5432/modern_router_mgmt
ROUTER_CREDENTIALS_KEY=<your-generated-key>
EOF
```

**4. Run the App Container:**
```bash
podman run -d --name modern-router-app \
  -p 3000:3000 \
  -p 3001:3001 \
  --env-file .env.docker \
  modern-router-app:latest
```

### Test the Deployment

```bash
# Access frontend (TanStack Start SSR)
curl http://localhost:3000

# Check API health endpoint
curl http://localhost:3001/health

# List routers via API
curl http://localhost:3001/routers

# Check container logs
podman logs modern-router-app
```

### Container Architecture

The single container includes:
- **TanStack Start Server** (port 3000): SSR frontend with React Router
- **NestJS API** (port 3001): Backend API server
- **Playwright Chromium**: Browser automation for router scraping

**Image Size:**
- Build stage: ~3 GB (includes build tools, Chromium, frontend build)
- Production stage: ~1 GB (slim, runtime only)

**Environment Variables:**
| Variable | Required | Description |
|----------|----------|-------------|
| `DB_ENGINE` | Yes | `sqlite` or `postgres` |
| `DATABASE_URL` | If postgres | PostgreSQL connection string |
| `ROUTER_CREDENTIALS_KEY` | Yes | Base64-encoded 32-byte key |
| `PORT` | No | API port (default: 3001) |

**Volumes:**
- PostgreSQL data is persisted in `postgres_data` volume
- App container is stateless (no volumes needed)

## Kubernetes Deployment

For production deployments, Kubernetes manifests are provided in the [`kubernetes/`](kubernetes/) folder.

### Quick Deploy

```bash
# Create secrets first (see kubernetes/README.md)
kubectl apply -f kubernetes/secrets.yaml

# Deploy everything
kubectl apply -k kubernetes/

# Check status
kubectl get pods -n modern-router-mgmt
```

### Features

- **Namespace isolation** - All resources in `modern-router-mgmt` namespace
- **StatefulSet for PostgreSQL** - Persistent storage for database
- **Deployment for API** - Scalable API with health checks
- **Ingress ready** - TLS termination with cert-manager support
- **Kustomize support** - Base and production overlays
- **Resource limits** - CPU and memory limits configured
- **Security contexts** - Non-root containers, read-only filesystem

See [`kubernetes/README.md`](kubernetes/README.md) for complete documentation.

## CI/CD

GitHub Actions workflow is configured in [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml).

### Pipeline Stages

1. **Lint** - Code linting and formatting checks
2. **Type Check** - TypeScript type checking
3. **Build** - Build all packages (API, Web, Types, Drivers)
4. **Test** - Run test suites
5. **Docker Build & Push** - Build and push combined container to ghcr.io

### Triggers

- **Push to main/develop** - Full pipeline + build/push Docker image
- **Push tags (v*)** - Full pipeline + build/push with semantic version tags
- **Pull Request** - Lint, type check, build, test

### Manual Deployment

After the Docker image is pushed to the registry:

```bash
# Pull the latest image
docker pull ghcr.io/rootdavinalfa/modern-router-management:latest

# Run with PostgreSQL
docker run -d --name modern-router-app \
  -p 3000:3000 \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e DB_ENGINE=postgres \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e ROUTER_CREDENTIALS_KEY=your-key \
  ghcr.io/rootdavinalfa/modern-router-management:latest
```

Access:
- **Frontend**: http://localhost:3000 (TanStack Start SSR)
- **API**: http://localhost:3001

For Kubernetes deployment, see [`kubernetes/README.md`](kubernetes/README.md).

## Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [TanStack](https://tanstack.com/) - React Router and Query
- [Turborepo](https://turborepo.org/) - Build system for monorepos
- [Playwright](https://playwright.dev/) - Browser automation
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
