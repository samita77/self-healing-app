# Dashboard Page Overrides

> **PROJECT:** Self-Healing DevOps Platform
> **Page Type:** Operations Console
> **Rules in this file OVERRIDE `MASTER.md`.**

---

## What This Page Must Answer

An examiner looking at this screen for three seconds should be able to answer:

1. Is anything currently broken?
2. What has this platform done automatically on my behalf?
3. Does it explain itself?

Everything below serves those three questions.

---

## Layout

```
+------------------------------------------------------------------+
| Status strip: [Project A  HEALTHY 94.6]  [Project B  FAILED 29.2]  |
+------------------------------------------------------------------+
| Projects table                                                   |
|  name | repo | image | last status | score | run pipeline        |
+------------------------------------------------------------------+
| Recent deployments                                               |
|  version | commit | status | score | recovered in |  -> detail          |
+------------------------------------------------------------------+
```

- Max width 1400px, 12-column grid
- Status strip first — it is the answer to question 1
- **Run pipeline** is the single primary action, one per project row
- Deployment table sorted newest first; every row links to its detail view

---

## Components

### `StatusBadge`

Props: `status` (`SUCCESSFUL` | `WARNING` | `FAILED`), optional `score`.

```tsx
<span className={`status-badge status-badge--${variant}`}>
  <StatusIcon aria-hidden="true" />
  {status}
</span>
```

Where `variant` maps SUCCESSFUL->healthy, WARNING->warning, FAILED->failed. **The icon is decorative;
the text label is what a screen reader announces.** Never render the badge without the label.

### `HealthGauge`

Props: `score` (0–100), `thresholds` (default `{ warning: 50, healthy: 80 }`).

- Custom SVG arc, three gradient bands using `--status-*`
- Threshold ticks at 50 and 80
- Numeric score rendered **beside** the arc, not inside it
- Sub-label: "target 80" so the threshold is explicit without relying on colour

### `ScoreBreakdown`

Renders the four components returned by `/health`:

| Component | Key | Weight |
|-----------|-----|--------|
| Availability | `S_availability` | 0.40 |
| Response time | `R_response_time` | 0.30 |
| Error rate | `E_error_rate` | 0.20 |
| Pod readiness | `P_pod_readiness` | 0.10 |

Display the **weighted contribution**, not just the raw component, so the total is explainable:
`0.40 x 100 = 40.0`. This is the single most persuasive element in the UI — it shows the algorithm is
real and reproducible.

### `DeploymentRow`

Columns: version | commit SHA (mono) | status badge | score | recovery time | link

Recovery time shows a dash when no rollback occurred. **Never show `0` or `null` raw** — use an
em dash, so "no rollback" is visually distinct from "recovered instantly".

### `GrafanaEmbed`

`<iframe src={grafanaUrl}>` sized to the container.

- `title` attribute required for a11y
- Panel borders set to `--color-border` so the embed does not look bolted on
- Reminder: Grafana panels must use the same three status hex values

---

## States

Every async surface needs all four:

| State | Treatment |
|-------|-----------|
| Loading | Skeleton rows matching table height, **not** a centred spinner |
| Empty | "No deployments yet. Run the pipeline to create the first one." + the trigger button |
| Error | Inline message naming the failed call, not a generic "Something went wrong" |
| Success | — |

The **empty state matters most here.** First-time examiners see the dashboard before any deployment
exists, so that screen is doing the introduction. Make it instructional.

---

## Long-Running Actions

The pipeline endpoint blocks while cloning, building, testing and pushing — potentially minutes.

- Trigger button enters a disabled state immediately with the label "Pipeline running..."
- Show the current stage if available (`Build` / `Test` / `Push`)
- **Never let the button look responsive while it is blocked**
- Surface a "last updated" timestamp so auto-refresh is never invisible

---

## Accessibility Requirements

- Status is conveyed by colour **+** text **+** icon (never colour alone)
- Every status badge text is readable by a screen reader
- Icon-only controls carry `aria-label`
- All inputs have `<label>` elements; inline errors stay in the field
- Focus visible on every interactive element
- Table headers are `<th scope="col">`
- Respects `prefers-reduced-motion`
- Responsive at 375 / 768 / 1024 / 1440px — the deployment table collapses to cards on mobile

---

## Do Not Build

- Real-time streaming charts (30s window is not streaming)
- Drag-and-drop reordering
- Project editing/deletion (not needed for the demonstration)
- A charting library for anything other than the trend line — the gauge is cheaper as SVG
- Decorative animation of any kind beyond 150–300ms fades