# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Self-Healing DevOps Platform
**Generated:** 2026-10-16 11:48:13
**Category:** Developer Tool / IDE
**Design Dials:** Density 8/10 (Dense / Dashboard)
**Stack:** Next.js (TypeScript) + Tailwind CSS

---

## Project Context (read before building any page)

This is a **self-healing deployment platform**. A developer registers a Git repository; the platform
clones it, builds a container image, runs tests, deploys to Kubernetes, then watches the running
application. If the health score drops below threshold, it **automatically rolls back** and reports how
long recovery took.

**The three deployment states are the core data model of this interface.** Most design decisions here
follow from one requirement: a reader must be able to tell, at a glance, whether a deployment is
healthy, degraded, or failed — and must never be able to misinterpret one.

**What the dashboard must make obvious:**

1. Current status of every deployment (the three semantic colours)
2. The four component scores behind the total (availability, response time, error rate, pod readiness)
3. **Why** a rollback happened — the decision reason string is not optional content
4. How long recovery took — this is a headline metric, not a footnote
5. Commit SHA and image tag for every run — these are the audit trail

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#1E293B` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#334155` | `--color-secondary` |
| On Secondary | `#FFFFFF` | `--color-on-secondary` |
| Accent/CTA | `#22C55E` | `--color-accent` |
| On Accent/CTA | `#0F172A` | `--color-on-accent` |
| Background | `#0F172A` | `--color-background` |
| Foreground | `#F8FAFC` | `--color-foreground` |
| Card | `#1B2336` | `--color-card` |
| Card Foreground | `#F8FAFC` | `--color-card-foreground` |
| Muted | `#272F42` | `--color-muted` |
| Muted Foreground | `#94A3B8` | `--color-muted-foreground` |
| Border | `#475569` | `--color-border` |
| Destructive | `#EF4444` | `--color-destructive` |
| On Destructive | `#000000` | `--color-on-destructive` |
| Ring | `#FFFFFF` | `--color-ring` |

**Color Notes:** Code dark + run green

### Semantic Status Tokens (PROJECT-SPECIFIC — highest priority)

This project has exactly three deployment states. These tokens are the **single source of truth** and
must be consumed everywhere a status appears: project cards, deployment table rows, status badges, the
health gauge, the trend-chart legend, and Grafana panels.

| Status | Hex | Token | Tailwind | Score range |
|--------|-----|-------|----------|-------------|
| `SUCCESSFUL` | `#22C55E` | `--status-healthy` | `green-500` | >= 80 |
| `WARNING` | `#F59E0B` | `--status-warning` | `amber-500` | 50 – 79 |
| `FAILED` | `#EF4444` | `--status-failed` | `red-500` | < 50 |

**Note:** `amber-500` is an addition. The generated palette supplies only green and red, but the health
algorithm produces three states, so a third semantic colour is required.

**Rules:**

1. **Never hardcode a status hex in a component.** Read the token. This is what guarantees the three
   states mean the same thing everywhere.
2. **Colour is never the only indicator (WCAG).** Every status badge carries colour **plus** a text
   label **plus** an icon. Decorative icons take `aria-hidden="true"`; the text label is what a screen
   reader announces.
3. **Grafana panels must use the same three hex values.** Default Grafana blue/orange/green will
   visibly clash with the frontend. Set per-panel: Panel -> Edit -> Standard options -> Color scheme.
4. **`WARNING` is not a softer `FAILED`.** Amber means "degraded but live"; red means "recovering".
   Never use amber as a decorative accent elsewhere in the UI.

### Tailwind Mapping

The entire palette is Tailwind's `slate` scale, so tokens resolve to literal class names:

| Role | Hex | Tailwind class |
|------|-----|----------------|
| Background | `#0F172A` | `bg-slate-900` |
| Card surface | `#1B2336` | `bg-slate-800` |
| Border | `#475569` | `border-slate-600` |
| Muted text | `#94A3B8` | `text-slate-400` |
| Foreground | `#F8FAFC` | `text-slate-50` |
| Healthy | `#22C55E` | `text-green-500` |
| Warning | `#F59E0B` | `text-amber-500` |
| Failed | `#EF4444` | `text-red-500` |

### Typography

- **Heading Font:** JetBrains Mono
- **Body Font:** IBM Plex Sans
- **Mood:** code, developer, technical, precise, functional, hacker
- **Google Fonts:** [JetBrains Mono + IBM Plex Sans](https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

### Spacing Variables

*Density: 8/10 — Dense / Dashboard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` / `0.125rem` | Tight gaps |
| `--space-sm` | `4px` / `0.25rem` | Icon gaps, inline spacing |
| `--space-md` | `8px` / `0.5rem` | Standard padding |
| `--space-lg` | `12px` / `0.75rem` | Section padding |
| `--space-xl` | `16px` / `1rem` | Large gaps |
| `--space-2xl` | `24px` / `1.5rem` | Section margins |
| `--space-3xl` | `32px` / `2rem` | Hero padding |

### Shadow Depths

> **Dark-surface note:** the alpha values below are near-invisible against `#0F172A`. On this theme,
> **surface separation comes from a 1px `--color-border` stroke**, not from shadows. Reserve shadows
> for elements that genuinely float above the page (modals, dropdowns, hover overlays).

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | Floating elements only |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.5)` | Modals, dropdowns |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.6)` | Overlays |

**Separation (preferred on dark):** `border: 1px solid #475569;`

---

## Component Specs

> **Corrections applied to the generated spec.** The auto-generated component CSS was written for a
> *light* theme and pasted into a *dark* palette. It specified a card background identical to the page
> background (invisible), a white modal, a near-white input border, and a dark-on-dark secondary
> button. All specs below are corrected for a dark surface. **Separation comes from borders, not
> shadows** — drop shadows are invisible against `#0F172A`.

### Buttons

```css
/* Primary — dark text on green, per the palette's --color-on-accent */
.btn-primary {
  background: #22C55E;
  color: #0F172A;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  border: 1px solid transparent;
  transition: opacity 200ms ease;
  cursor: pointer;
}

.btn-primary:hover { opacity: 0.9; }

.btn-primary:focus-visible {
  outline: 2px solid #F8FAFC;
  outline-offset: 2px;
}

/* Destructive — for "Rollback", "Delete", "Force rollback" */
.btn-danger {
  background: #EF4444;
  color: #0F172A;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
}

/* Secondary — was near-invisible on dark; border now uses slate-600 */
.btn-secondary {
  background: transparent;
  color: #F8FAFC;
  border: 1px solid #475569;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: border-color 200ms ease;
  cursor: pointer;
}

.btn-secondary:hover { border-color: #94A3B8; }

.btn-secondary:focus-visible {
  outline: 2px solid #F8FAFC;
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Cards

```css
/* Background MUST differ from the page background (#0F172A) or the card vanishes. */
.card {
  background: #1B2336;
  border: 1px solid #475569;
  border-radius: 12px;
  padding: 24px;
}

.card-interactive { cursor: pointer; transition: border-color 200ms ease; }
.card-interactive:hover { border-color: #94A3B8; }
```

### Status Badge

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 1px solid currentColor;
}

.status-badge--healthy { color: #22C55E; background: #22C55E1A; }
.status-badge--warning { color: #F59E0B; background: #F59E0B1A; }
.status-badge--failed  { color: #EF4444; background: #EF44441A; }
```

`1A` is a 10% alpha suffix, used so the tint reads as a surface rather than a block of colour.

### Inputs

```css
.input {
  background: #0F172A;
  color: #F8FAFC;
  padding: 12px 16px;
  border: 1px solid #475569;   /* was #E2E8F0 — a light border on a dark theme */
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input::placeholder { color: #94A3B8; }

.input:focus {
  border-color: #22C55E;
  outline: none;
  box-shadow: 0 0 0 3px #22C55E33;
}

/* Inline validation — errors keep their text in the field */
.input-error { border-color: #EF4444; }
.input-error:focus { box-shadow: 0 0 0 3px #EF444433; }
```

### Tables (deployment history)

```css
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th {
  text-align: left;
  color: #94A3B8;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 8px 12px;
  border-bottom: 1px solid #475569;
}
.table td { padding: 12px; border-bottom: 1px solid #272F42; }
.table tbody tr:hover { background: #1B2336; }

/* Identifiers use mono — signals "literal value you may copy" */
.table td.mono { font-family: var(--font-mono); color: #94A3B8; }
```

### Modals

```css
.modal-overlay {
  background: rgba(2, 6, 23, 0.7);
  backdrop-filter: blur(4px);
}

.modal {
  background: #1B2336;   /* was white — unreadable against the overlay */
  color: #F8FAFC;
  border: 1px solid #475569;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
}
```

### Monospace Utility

```css
.mono {
  font-family: var(--font-mono);
  font-variant-ligatures: none;
}
```

Apply to commit SHAs, image tags, deployment versions, durations, and log output. The mono/sans split
is functional: mono means "literal identifier that may be copied".

---

## Chart Specifications

Two charts only. Both were selected by matching the data shape to the chart's intended use.

### Health Score -> Gauge Chart

The score is a **single KPI measured against a defined threshold**, which is exactly the gauge use
case.

- Gradient bands: red (0–49) / amber (50–79) / green (80–100) using the status tokens
- Mark the 50 and 80 thresholds on the arc
- **Print the numeric score and the label beside the gauge, never inside it** — red/amber/green alone
  fails WCAG
- Library: D3.js, ApexCharts, or a custom SVG arc (cheapest — no dependency)

### Health Score Over Time -> Line Chart

Trend across a time axis with few points.

- Add reference lines at y=50 and y=80 so a deployment visibly **crossing** into failure is apparent
- Distinct colours **plus** distinct line styles — never hue alone
- Library: Recharts or Chart.js

> **Do not build a real-time streaming chart.** The probe window is 30 seconds, so data updates roughly
> twice per minute. A periodic-refresh line chart is correct; streaming adds complexity for no benefit.

---

## Style Guidelines

**Style:** Dark Mode (OLED)

**Keywords:** Dark theme, low light, high contrast, deep black, midnight blue, eye-friendly, OLED, night mode, power efficient

**Best For:** Night-mode apps, coding platforms, entertainment, eye-strain prevention, OLED devices, low-light

**Key Effects:** Minimal glow (text-shadow: 0 0 10px), dark-to-light transitions, low white emission, high readability, visible focus

### Page Pattern

> **Corrected.** The generated pattern was `FAQ/Documentation Landing` (hero, categories, accordion,
> contact CTA). That is a marketing/docs structure and does not apply to an operations console. The
> layout below reflects what this dashboard actually does.

**Pattern Name:** Operations Console

- **Primary goal:** answer "is my deployment healthy right now, and what happened?" in under 3 seconds
- **Information hierarchy:**
  1. **Status strip** — active deployments with their live status badge and health score
  2. **Primary action** — one obvious "Run pipeline" control per project
  3. **History** — deployment table, newest first, sortable, each row linking to detail
  4. **Detail view** — the recovery report: score breakdown, component scores, rollback reason, duration
- **Density:** high — 12-column grid, 1400px max width, compact rows
- **No marketing sections.** No hero, no feature grid, no testimonials, no CTA banner.

---

## Anti-Patterns (Do NOT Use)

- ❌ Light mode default
- ❌ Slow performance

### Project-Specific Forbidden Patterns

- ❌ **Status colour as the sole indicator** — always colour + text label + icon (WCAG 1.4.1)
- ❌ **Hardcoded status hex in a component** — read `--status-*` tokens, or states will drift apart
- ❌ **Amber used decoratively** — it is reserved for `WARNING`; reusing it as an accent destroys meaning
- ❌ **Hidden rollback reason** — the `decide()` reason string must be rendered, not logged server-side only
- ❌ **Card background equal to page background** — surfaces must be visually distinct
- ❌ **Real-time streaming charts** — data updates every 30s; a refresh line chart is correct
- ❌ **Auto-refresh without a visible indicator** — if the page polls, show a "last updated" timestamp

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — On dark surfaces use `border-color` transitions, not `scale()`/`translateY()`
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y
- ❌ **Unlabelled input fields** — every field needs a `<label>`, not just a placeholder
- ❌ **Spinner with no context** — a long-running action shows what it is doing ("Building image...")

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
