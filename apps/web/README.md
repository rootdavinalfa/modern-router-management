# Web Client

TanStack React-based web application for the Modern Router Management system.

## Prerequisites

- **Node.js**: v18 or higher
- **Package Manager**: Bun v1.3.5 or higher (recommended)
- **API Server**: The API server must be running (see `apps/api/README.md`)

## Installation

```bash
# From project root
bun install
```

## Configuration

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Update `.env.local` if needed:

```bash
# API URL (default works for local development)
VITE_API_URL=http://localhost:3001

# Enable TanStack DevTools (optional)
TANSTACK_VITE_DEVTOOLS=true
```

## Running the Application

```bash
# Development mode
bun run dev

# Production build
bun run build

# Preview production build
bun run preview
```

## Testing

```bash
# Run tests
bun run test
```

## Code Quality

```bash
# Lint code
bun run lint

# Format code
bun run format

# Fix linting and formatting
bun run check
```

## Project Structure

```
src/
├── components/         # Reusable UI components
│   └── dashboard/     # Dashboard-specific components
├── lib/               # Utilities and API client
├── routes/            # File-based routing
│   ├── api/          # API routes
│   └── index.tsx     # Main dashboard page
└── integrations/      # Third-party integrations
```

## Features

- **Dashboard**: Real-time router status and metrics
- **PON Optical Module**: View optical power, temperature, and voltage
- **WAN Connections**: Monitor all WAN connections with IPv4/IPv6 support
- **Router Management**: Add and switch between multiple routers
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: TanStack React Start
- **Routing**: TanStack Router (file-based)
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: TanStack Query
- **UI Components**: Custom component library (`@modern-router-management/ui`)

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run test` | Run tests |
| `bun run lint` | Lint code |
| `bun run format` | Format code |
| `bun run check` | Fix linting and formatting |

## Troubleshooting

### "Failed to fetch from API"
Make sure the API server is running on port 3001 (or update `VITE_API_URL` in `.env.local`).

### Build errors
Clear the build cache and reinstall:
```bash
rm -rf node_modules dist .turbo
bun install
```

### Tailwind styles not loading
Check that `tailwindcss` is imported in your CSS file and the plugin is configured in `vite.config.ts`.

## Deployment

The application can be deployed to any static hosting service:

```bash
# Build
bun run build

# Deploy the dist/client folder to your hosting
```

For Vercel deployment, the build output is automatically configured.
