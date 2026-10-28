# Project Status — Self-Healing DevOps Deployment Platform

**Course:** CACS452 Project III · IV/VIII Semester
**Last updated:** 2026-10-28
**Commits:** 25+ · **Tests:** 30 passing · **Overall:** ~95% complete

---

## 1. At a Glance

| | |
|---|---|
| **What it does** | Developers register a Git repository. The platform clones it, builds a container image, runs tests, deploys to Kubernetes, watches the running app, and **automatically rolls back** if health degrades. |
| **Core contribution** | A weighted multi-component health-scoring algorithm with tunable parameters, plus decision logic that prevents harmful automatic actions. |
| **Environment** | 7 GB RAM (hard constraint) · Minikube · Supabase PostgreSQL |
| **Backend** | FastAPI + SQLAlchemy · Alembic migrations · JWT auth · ownership scoping |
| **Frontend** | Next.js 16 + TypeScript + Tailwind v4 · 7 pages · 6 components |
| **Monitoring** | Prometheus + Grafana inside Minikube |

---

## 2. The Distinction That Defines This Project

This is the single most important idea to hold onto. Getting it backwards is the main way this project can be misunderstood.

```
┌─────────────────────────────────────────────────┐
│  THE PLATFORM — what you build and are graded on│
│                                                 │
│  FastAPI backend  +  Next.js dashboard          │
│  Pipeline Engine  ·  Health Scorer              │
│  Rollback Engine  ·  Failure Classifier         │
└──────────────────┬──────────────────────────────┘
                   │  clones, builds, deploys
                   ▼
┌─────────────────────────────────────────────────┐
│  TENANT #1 — samita77/todo-app (someone's repo)  │
│                                                 │
│  You do NOT own or edit this code.              │
│  It exists to prove the platform works.         │
└─────────────────────────────────────────────────┘
```

The todo application is **not part of your product**. It is the first tenant — a stand-in for every student who will later register a repository of their own.

**The platform box and the tenant box must never overlap** in your component diagram.

---

## 3. Completion by Phase

| Phase | Scope | State | % |
|---|---|---|---|
| 1 | Foundation hardening | Complete | 100% |
| 2 | Pipeline engine (clone → test → build → push → deploy → verify) | Complete | 100% |
| 3 | Self-healing: health scoring, rollback, safeguards | Complete | 100% |
| 4 | Dashboard (frontend): landing, login, register, dashboard, admin, metrics, DORA | Complete | 100% |
| — | Authentication & roles (admin / developer) | Complete | 100% |
| — | End-to-end verification | Complete | 100% |

---

## 4. What Is Verified Working

All of these were run against the live stack, not assumed.

### Pipeline end-to-end

```
Build   0.08s  ok
Test    0.19s  ok
Push    1.10s  ok
Deploy  5.85s  ok
Verify 27.91s  ok
```

Total run: **35.23 seconds — SUCCESS**. All five stages pass against a real minikube cluster with the local registry.

### Health scoring — verified against the frontend

| Scenario | Score | Result |
|---|---|---|
| Healthy, typical speed | 94.6 | SUCCESSFUL |
| Healthy but slow | 76.7 | WARNING |
| Broken — mostly failing | 29.2 | FAILED |

### Real health check against the running application

```
score      : 96.88   SUCCESSFUL
components : {S_availability: 100, R_response_time: 89.6,
              E_error_rate: 100,  P_pod_readiness: 100}
rollback   : False
```

### Failure detection — the classifier earns its place

Pointed at a dead port:

```
score        : 10.0   FAILED
probes       : 10 total, 10 failed
rollback     : True
FAILURE TYPE : HEALTH_CHECK_FAILURE
```

Stored rollback reasons:

```
HEALTH_CHECK_FAILURE        ← current (automatic rollback)
```

### Pipeline state machine

```
CREATED → RUNNING → BUILDING → TESTING → PUSHING → DEPLOYING → VERIFYING → SUCCESS
                                     ↘ FAILED → ROLLING_BACK → ROLLBACK_COMPLETE
```

Illegal moves are rejected: `BUILDING → SUCCESS` raises. A truncated pipeline is correctly refused rather than silently reporting success.

### Authentication & ownership scoping — verified

| Scenario | Result |
|---|---|
| Admin lists projects | 3 projects (all) |
| Developer lists projects | 0 projects (none owned) |
| Developer → `/projects/1` (admin's project) | 404 |
| Admin → `/projects/1` | 200 |
| No token → any API endpoint | 401 |
| Registration always creates `developer` | ✅ |
| Admin only via `scripts/seed_admin.py` | ✅ |

---

## 5. Algorithms Implemented

The syllabus requires "appropriate algorithms," not CRUD. Seven algorithmic constructs exist:

| # | Algorithm | Where |
|---|---|---|
| 1 | Weighted linear combination `H = w₁S + w₂R + w₃E + w₄P` | `health_scorer.py` |
| 2 | Exponential decay `100·e^(−p95/τ)` for response time | `health_scorer.py` |
| 3 | 95th-percentile order statistic | `health_monitor.py` |
| 4 | Multi-tier threshold classification (80 / 50) | `health_scorer.py` |
| 5 | Deadline-bounded probe window | `health_monitor.py` |
| 6 | Consecutive-failure counter (flap detection) | `rollback_engine.py` |
| 7 | Failure classification by degraded component | `failure_classifier.py` |

Plus:

| # | Algorithm | Where |
|---|---|---|
| 8 | Rollback candidate selection (known-good first, then fallback) | `rollback_selector.py` |
| 9 | Exponential Moving Average (EWMA) trend detection | `trend_detector.py` |
| 10 | DORA metrics (deployment frequency, lead time, MTTR, change failure rate) | `routes/dora.py` |

Plus the pipeline state machine with enforced transitions (`states.py`).

### Three safeguards that prevent harmful automation

1. **Flapping protection** — two consecutive failing windows before acting. One slow request never destroys a healthy release.
2. **No-previous-version guard** — if nothing exists to restore, the deployment is marked failed but no rollback is attempted.
3. **Explanatory reasons** — every decision returns *why*, so no action appears unexplained.
4. **Known-good rollback target** — rollback targets the most recent successful deployment with score ≥ 80, not blindly the previous version.

---

## 6. Fixture Repository

The registered GitHub repository `github.com/samita77/todo-app` has been pushed with a root `Dockerfile`, `tests/`, and `utils/`. The platform clones it and builds successfully.

```
Dockerfile        FROM node:20-alpine, COPY . ., EXPOSE 5000
index.js          app entry, /metrics endpoint
package.json      npm test → node --test tests/
tests/            5 validator tests
utils/            validators module
```

---

## 7. Remaining Work (polish, not blocking)

| Task | Time |
|---|---|
| Update `docs/STATUS.md` | Done |
| Frontend tests | Skip (deferred) |
| Real-time updates (WebSocket/polling) | Polling implemented for pipeline runs |
| Project edit/delete | Complete |

---

## 8. Commands

### Start everything

```bash
minikube start --cpus=4 --memory=3072
minikube addons enable registry
kubectl apply -f k8s-manifests/

cd backend  && .venv/bin/uvicorn app.main:app --reload
cd frontend && npm run dev
```

### Test

```bash
cd backend && .venv/bin/python -m pytest tests/ -q     # 30 tests
cd frontend && npx tsc --noEmit                       # type check
```

### Database migrations

```bash
cd backend
.venv/bin/alembic revision --autogenerate -m "describe change"
.venv/bin/alembic upgrade head
```

Always read the generated migration before applying it.

### Endpoints

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/` | Landing page | Public |
| GET | `/login` | Sign in | Public |
| POST | `/login` | Authenticate | Public |
| GET | `/register` | Sign up | Public |
| POST | `/register` | Create account | Public |
| GET | `/dashboard` | Role-based dashboard | Auth |
| GET | `/projects/` | List projects | Auth |
| POST | `/projects/` | Register a project | Auth |
| GET | `/projects/{id}` | One project | Auth |
| PUT | `/projects/{id}` | Edit a project | Auth (owner) |
| DELETE | `/projects/{id}` | Delete a project | Auth (owner) |
| GET | `/deployments/` | List deployments | Auth |
| GET | `/deployments/{id}` | One deployment | Auth |
| GET | `/deployments/{id}/health-checks` | Score history | Auth |
| GET | `/deployments/{id}/rollback-events` | Rollback log | Auth |
| GET | `/deployments/{id}/dora` | DORA metrics | Auth |
| POST | `/pipelines/run/{project_id}` | Trigger a pipeline | Auth |
| GET | `/monitor/check-and-heal` | Health check and self-heal | Auth |
| GET | `/dora/metrics` | DORA metrics (deployment frequency, lead time, MTTR, change failure rate) | Auth |
| GET | `/users` | List all users | Admin |
| GET | `/admin` | Admin panel | Admin |

---

## 9. Environment Constraints

```
RAM        7 GB total  — the binding constraint
CPUs       12
Node.js    v24.20.0
Python     3.12.3
Kubernetes via Minikube
Database   Supabase (PostgreSQL) via connection pooler
```

Approximate memory footprint of the full stack:

| Component | RAM |
|---|---|
| Minikube control plane and nodes | ~3.0 GB |
| Next.js dev server | ~0.5 GB |
| Prometheus + Grafana | ~0.3 GB |
| Backend (uvicorn) | ~0.2 GB |
| Application pods | ~0.26 GB |
| **Total** | **~4.3 GB** |

**Close browser windows before demonstrating.** The machine is otherwise fine — but a monitoring system must never run on an overloaded host, or its latency and error measurements become meaningless.

---

## 10. Design System

Visual and interaction rules are persisted at:

```
design-system/self-healing-devops-platform/
├── MASTER.md            palette, components, typography, charts
└── pages/dashboard.md   page-specific layout and rules
```

The palette is Tailwind's `slate` scale. Status colours are defined **once** as semantic tokens:

| Status | Hex | Tailwind |
|---|---|---|
| SUCCESSFUL | `#22C55E` | `green-500` |
| WARNING | `#F59E0B` | `amber-500` |
| FAILED | `#EF4444` | `red-500` |

Two rules that must not be broken:

1. **Colour is never the only signal.** Every status carries colour + text label + icon.
2. **Never hardcode a status hex.** Read the token, or states will drift apart.

---

## 11. Known Issues

| Issue | Impact |
|---|---|
| `kubectl` 1.35.9 against cluster 1.37.0 | Warning only. `minikube kubectl` uses a matching version. |
| `mongodb.yaml` Pod is `OOMKilled` at 256 Mi limit | Wasted memory. The application uses MongoDB Atlas, so this Pod serves no purpose — delete it. |
| `DEPLOYING`, `VERIFYING`, `SCANNING` states are unreachable | By design — those stages exist in the state diagram for completeness. The pipeline uses Build → Test → Push → Deploy → Verify. |

---

## 12. Next Action

The platform is complete and demonstrable:

1. `minikube start` + `minikube addons enable registry`
2. Start backend and frontend
3. Login as `admin@self-healing.dev` / `admin123`
4. Click **Run pipeline** on any project
5. Watch Build → Test → Push → Deploy → Verify
6. Click **Check health** on a deployment
7. View `/dora` for metrics
8. View `/users` and `/admin` as admin

Nothing is blocking a demonstration.