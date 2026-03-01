# Web app

React + Vite + Tailwind + TanStack Query frontend for the Lifechange Ludik API.

## Run

From repo root:

```bash
# Terminal 1: start the API (default port 3000)
pnpm dev

# Terminal 2: start the web app (port 5173)
pnpm dev:web
```

Then open http://localhost:5173. The app proxies `/api` to the API, so no CORS setup is needed in dev.

## Build

```bash
pnpm --filter web run build
# or from root:
pnpm build:web
```

Output is in `apps/web/dist`.
