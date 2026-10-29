# Self-Healing DevOps Platform — Frontend

React single-page application for the Self-Healing DevOps Platform. It talks to
the FastAPI backend at `http://localhost:8000`.

## Stack

- React 19 + TypeScript
- Vite 8
- React Router 8 (client-side routing)
- TanStack Query 5 (caching, polling, mutations)
- Tailwind CSS 4

## Getting started

```bash
npm install
npm run dev
```

The dev server is pinned to **port 3000** because the backend CORS allowlist
only permits `http://localhost:3000`. Open <http://localhost:3000>.

The backend must be running separately:

```bash
cd ../backend
uvicorn app.main:app --reload --port 8000
```

### Environment

Configuration lives in `.env.local`:

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend origin | `http://localhost:8000` |
| `VITE_GRAFANA_URL` | Grafana base URL for the metrics iframe | *(empty — shows a hint)* |
| `VITE_MINIKUBE_IP` | Node IP used to prefill health-check URLs (NodePorts are not on the host) | `192.168.49.2` |

Only `VITE_`-prefixed variables are exposed to the browser.

## Scripts

| Script | Action |
|---|---|
| `npm run dev` | Vite dev server on `:3000` |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run preview` | Serve the production build on `:3000` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Routes

| Path | Access | Page |
|---|---|---|
| `/` | public | Landing (redirects signed-in users to the dashboard) |
| `/login`, `/register` | public | Authentication |
| `/dashboard` | signed in | Project list + registration |
| `/projects/:id` | signed in | Project detail, pipeline runs, deployments |
| `/projects/:id/edit` | signed in | Edit repository settings |
| `/deployments` | signed in | All deployments |
| `/deployments/:id` | signed in | Health gauge, check history, rollbacks |
| `/metrics` | signed in | Grafana iframe |
| `/dora` | signed in | DORA metrics |
| `/admin`, `/users` | admin | Administration |

## Authentication

Login returns a JWT which is stored in `localStorage` and sent as
`Authorization: Bearer <token>` on every request. The token expires after one
hour; any `401` clears the session and redirects to `/login`.

Client-side route guards (`ProtectedRoute`, `AdminRoute`) are a UX convenience —
the backend remains the authorization boundary and rejects invalid tokens (401)
and non-admin users (403).

## Deployment

`npm run build` produces a static bundle in `dist/`. Because routing is
client-side, the host must rewrite unknown paths to `index.html` (SPA fallback),
e.g. nginx `try_files $uri /index.html;`. `npm run preview` does this locally.
