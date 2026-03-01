# Lifechange Ludik

pnpm monorepo for the Lifechange Ludik project.

## Structure

```
lifechange-ludik/
├── apps/
│   └── api/          # NestJS API
├── packages/         # Shared packages (add libs here)
├── package.json      # Root workspace
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js 18+
- pnpm 10+ (`npm install -g pnpm` or enable via corepack)

## Setup

```bash
pnpm install
```

## Scripts (from root)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run API in watch mode |
| `pnpm build` | Build all apps/packages |
| `pnpm build:api` | Build API only |
| `pnpm start:api` | Run API |
| `pnpm start:api:prod` | Run API (production) |
| `pnpm lint` | Lint all workspaces |
| `pnpm test` | Run tests in all workspaces |
| `pnpm test:e2e` | Run API e2e tests |
| `pnpm format` | Format code with Prettier |

## Working in a single app

```bash
# From repo root
pnpm --filter api run start:dev

# Or from apps/api
cd apps/api && pnpm run start:dev
```

## Adding a new app or package

1. **New app**: Create `apps/<name>/` with its own `package.json` (and set `"name": "<name>"` for filtering).
2. **New shared package**: Create `packages/<name>/` with `package.json`; other workspaces can depend on it with `"@lifechange-ludik/<name>": "workspace:*"` (after you add a proper package name).

## API (NestJS)

The API lives in `apps/api/`. See `apps/api/` for NestJS-specific docs. Default port: 3000.
