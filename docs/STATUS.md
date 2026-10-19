# Project Status — Self-Healing DevOps Deployment Platform

**Course:** CACS452 Project III · IV/VIII Semester
**Last updated:** 2026-07-19
**Commits:** 12 · **Tests:** 30 passing · **Overall:** ~70% complete

---

## 1. At a Glance

| | |
|---|---|
| **What it does** | Developers register a Git repository. The platform clones it, builds a container image, runs tests, deploys to Kubernetes, watches the running app, and **automatically rolls back** if health degrades. |
| **Core contribution** | A weighted multi-component health-scoring algorithm with tunable parameters, plus decision logic that prevents harmful automatic actions. |
| **Environment** | 7 GB RAM (hard constraint) · Minikube · Supabase PostgreSQL |
| **Backend** | FastAPI + SQLAlchemy · 28 classes · Alembic migrations |
| **Frontend** | Next.js 16 + TypeScript + Tailwind v4 · 5 pages · 4 components |
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

The todo application is **not part of your product**. It is the first tenant — a stand-in for
every student who will later register a repository of their own.

**The platform box and the tenant box must never overlap** in your component diagram.

---

## 3. Completion by Phase

| Phase | Scope | State | % |
|---|---|---|---|
| 1 | Foundation hardening | Complete | 95% |
| 2 | Pipeline engine (clone → test → build → push) | Complete | 100% |
| 3 | Self-healing: health scoring, rollback, safeguards | Complete | 100% |
| 4 | Dashboard (frontend) | 5 pages, 4 components, navigation | **88%** |
| — | Tier 1: dead-code cleanup and wiring | Complete | 100% |
| — | Tier 3: end-to-end verification | Blocked | 20% |

Documentation is intentionally excluded from this estimate. It is planned separately for when the
semester begins.

---

## 4. What Is Verified Working

These were run, not assumed.

### Health scoring — verified against the frontend

The algorithm produces three clearly separated outcomes:

| Scenario | Score | Result |
|---|---|---|
| Healthy, typical speed | 94.6 | SUCCESSFUL |
| Healthy but slow | 76.7 | WARNING |
| Broken — mostly failing | 29.2 | FAILED |

The frontend recomputes the same totals from the four component scores and matches exactly. This
confirms the algorithm behaves identically on both sides of the stack.

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

Stored rollback reasons, oldest first — the contrast is the whole point:

```
2026-10-18  HEALTH_CHECK_FAILURE                        ← current
2026-10-07  Health score 25.0 below threshold           ← before
2026-10-07  Health score 25.0 below threshold           ← before
```

### Pipeline state machine

```
CREATED  → RUNNING → BUILDING → TESTING → PUSHING → SUCCESS
                                 ↘ FAILED → ROLLING_BACK → ROLLBACK_COMPLETE
```

Illegal moves are rejected: `BUILDING → SUCCESS` raises. A truncated pipeline is correctly refused
rather than silently reporting success.

### Stage durations and error capture

```
ALL PASS    -> success   Build(building) ok, Test(testing) ok, Push(pushing) ok
EXCEPTION   -> failed    Build ok | Test FAIL | "docker daemon unreachable"
STAGE FALSE -> failed    halted at ['Test']
```

The exception case matters most: a crashed build is now **recorded with its reason** rather than
leaving the run stuck forever.

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

Plus the pipeline state machine with enforced transitions.

### Three safeguards that prevent harmful automation

These are the difference between a useful system and a dangerous one:

1. **Flapping protection** — two consecutive failing windows before acting. One slow request never
   destroys a healthy release.
2. **No-previous-version guard** — if nothing exists to restore, the deployment is marked failed but
   no rollback is attempted.
3. **Explanatory reasons** — every decision returns *why*, so no action appears unexplained.

---

## 6. The Current Blocker

**The registered GitHub repository cannot be built.**

| | `backend/sample-app/` | `github.com/samita77/todo-app` |
|---|---|---|
| `Dockerfile` at root | ✅ | ❌ only inside `server/` |
| `tests/` directory | ✅ | ❌ |
| `utils/` directory | ✅ | ❌ |

The local copy was tidied but **never pushed**. So the platform clones a repository with no root
Dockerfile, `docker build` fails, and the pipeline dies at its first stage.

**Fix — one push, about 15 minutes:**

```bash
cd /home/samita/self-healing-platform/backend/sample-app
rm -rf node_modules
git init && git add -A
git commit -m "Deployable: root Dockerfile, tests, utils"
git remote add origin https://github.com/samita77/todo-app
git push -u origin main --force
```

> `--force` rewrites that repository's history. The current contents cannot be built, so nothing
> functional is lost — but confirm before running.

---

## 7. Remaining Work

### Blocking the demonstration

| Task | Time |
|---|---|
| Push the fixture repository | 15 min |
| Enable registry addon, deploy Prometheus + Grafana | 30 min |
| Run the pipeline end to end through the dashboard | 45 min |

### Completing the dashboard

| Task | Time |
|---|---|
| Create-project form — demonstration step 1 | 45 min |
| Pipeline runs endpoint + stage list with durations | 45 min |
| Health-check history table | 30 min |
| `not-found.tsx` + `error.tsx` | 20 min |

### Syllabus gap

| Task | Time |
|---|---|
| Authentication and roles (admin / developer) | ~2 hrs |

### Deliberately excluded

| Item | Reason |
|---|---|
| GitHub webhook triggering | Requires a publicly reachable endpoint. On a local network this needs a tunnel — a demonstration-day failure mode for no grading value. |
| Docker Hub integration | The local in-cluster registry is used instead. No account needed, no internet needed. |
| OAuth / multi-tenant credential linking | Two days of work contributing nothing to a grade that is largely earned. |
| Loki, OpenTelemetry collector | Exceed the 7 GB memory budget. |
| Anomaly detection, deployment-risk scoring | Weak algorithms with unjustified thresholds. They would dilute the strong ones. |

---

## 8. Commands

### Start everything

```bash
minikube start --cpus=4 --memory=3072
kubectl apply -f k8s-manifests/
minikube addons enable registry
kubectl apply -f monitoring/

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

| Method | Path | Purpose |
|---|---|---|
| GET | `/projects/` | List projects |
| POST | `/projects/` | Register a project |
| GET | `/projects/{id}` | One project |
| GET | `/deployments/` | List deployments |
| GET | `/deployments/{id}` | One deployment |
| GET | `/deployments/{id}/health-checks` | Score history |
| GET | `/deployments/{id}/rollback-events` | Rollback log |
| POST | `/pipelines/run/{project_id}` | Trigger a pipeline |
| GET | `/monitor/check-and-heal` | Health check and self-heal |

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

**Close browser windows before demonstrating.** The machine is otherwise fine — but a monitoring
system must never run on an overloaded host, or its latency and error measurements become meaningless.

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
| `mongodb.yaml` Pod is `OOMKilled` at a 256 Mi limit | Wasted memory. The application uses MongoDB Atlas, so this Pod serves no purpose — delete it. |
| `kubectl` 1.35.9 against cluster 1.37.0 | Warning only. `minikube kubectl` uses a matching version. |
| `DEPLOYING`, `VERIFYING`, `SCANNING` states are unreachable | By design — those stages are not wired into the runner. They exist so the state diagram is complete. Do not claim the pipeline runs nine stages. |

---

## 12. Next Action

**Push the fixture repository**, then verify the pipeline runs end to end.

Nothing else on this list matters until the platform can be shown deploying a real application.
