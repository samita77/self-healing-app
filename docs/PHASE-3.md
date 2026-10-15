# Phase 3 — The Self-Healing Engine

**Project:** Cloud-Based Self-Healing DevOps Deployment Platform
**Style:** Plain language, no code. Readable by anyone without a technical background.

**This is the phase that decides whether the project matches its title.** Everything so far automates
deployment. This phase adds the part that *detects problems and recovers by itself*.

---

## The Problem Being Solved

Until now, the platform made one single request to a newly deployed application and decided the entire
release's fate from that one result.

That approach fails in three ways, and all three are realistic:

**One unlucky request destroys a good release.** If the single check lands during a momentary network
hiccup, a perfectly healthy release is judged broken.

**One lucky request hides a broken release.** An application that fails nine times out of ten passes
its check if that one check happened to arrive during the working ten per cent.

**The scores were not real measurements.** Response time was judged by a simple rule: under 500
milliseconds scores full marks, anything slower scores half. That is not a measurement, it is a
coin toss. The weighted formula built on top of it was therefore doing almost no real work.

---

## What Changed

### From one guess to a measurement window

Instead of a single request, the platform now **watches the application for a period of time** —
thirty seconds, checking every three seconds — and measures what actually happened.

It records:

- how many checks were made
- how many succeeded
- how many failed
- how long the slowest typical request took

From those numbers it calculates two things an examiner cares about:

**Availability** — the percentage of checks that succeeded. Not "did one request work?" but "did
ninety-eight per cent of ten requests work?"

**Error rate** — the percentage that failed.

**The 95th-percentile response time.** This deserves an explanation, because it is more useful than
the average. If ten requests took 100 milliseconds each except one that took five seconds, the
average is 583 milliseconds — which hides the problem almost completely. The 95th-percentile figure
correctly reports the five-second outlier. For a system deciding whether to roll back, the worst
real experience matters more than the typical one.

---

### From guesses to real scores

Each of the four parts of the health score is now a genuine measurement:

| Part | What it measures |
|---|---|
| **Availability** | Percentage of checks that succeeded |
| **Response time** | How slow the application is, using a smooth curve |
| **Error rate** | Percentage of checks that failed |
| **Pod readiness** | How many copies of the application are ready to serve requests |

**The response-time change is the most interesting.**

Previously, latency either scored full marks or half marks, with a cliff edge in between. Now the
score decays smoothly: the slower the application, the worse the score, with no sudden drop.

The decay is set by a single adjustable number, often called *tau*. At exactly that latency, the
application receives about 37 per cent of the available marks; beyond it the score keeps falling.
This is adjustable, which means it can be tuned against real experiments later — and that experiment
belongs in the results section of the report.

**A deliberate safety detail.** If no check ever succeeded, the system records zero rather than
treating the response time as "instantly fast". A missing measurement must never be mistaken for a
perfect one. This was a genuine design decision, not an oversight.

**How well the score separates outcomes**, using the weights already chosen:

| Situation | Score | Result |
|---|---|---|
| Healthy, typical speed | about 95 | Successful |
| Healthy but slow | about 77 | Warning |
| Broken — half failing, very slow | about 29 | Failed |

The three situations land in three clearly separated bands, which is what makes the thresholds
trustworthy.

---

### Three safeguards that prevent harmful action

This is where a thoughtful system differs from a dangerous one. Each safeguard exists because the
obvious, simpler implementation causes a real problem.

**1. Do not act on a single bad reading.**

The system requires **two consecutive failing windows** before doing anything. One slow request no
longer destroys a good release. This is sometimes called *flapping protection* — the application
briefly looks unhealthy and immediately recovers, and that brief moment is not treated as a genuine
failure.

**2. Never attempt a recovery when there is nothing to recover to.**

If the very first deployment fails, there is no earlier version to return to. Attempting a recovery
would restore nothing and simply produce a confusing error.

This matters because the earlier version of the platform *would* have tried anyway. Now the system
detects the situation, declines to act, and explains why in plain words. A deployment is still
recorded as failed — but the system does not pretend it can undo something that never existed.

**3. Always explain the decision.**

Every decision returns a written reason, not just a yes or no. This is what allows the dashboard to
show a human-readable explanation, and what makes the system debuggable rather than mysterious.

---

### Measuring recovery

When a recovery happens, the system records exactly how long it took — from the moment the decision was
made to the moment the application was re-checked and confirmed healthy.

This is not a convenience. It is one of the four industry-standard measures of delivery performance
(the "failed deployment recovery time" measure). It is a real, measured number rather than an estimate,
and it goes directly into the results table comparing manual deployment with this platform.

---

### Waiting for the right version

One more important detail. Before any checking begins, the system now **waits for the release to
actually finish**.

Without this, checking could begin while the *previous* version was still serving requests — and the
system would measure the old version while believing it was measuring the new one. Every health score
would then be meaningless, and the entire recovery mechanism would be built on false readings.

---

## Testing

Four automated checks confirm the scoring behaves correctly, covering:

- a healthy application scores as successful
- an application failing every single check scores as failed
- a missing measurement is never treated as a perfect one
- the weights can be changed per project, and the score responds correctly

All four pass.

---

## Still Outstanding

This section lists what is **not yet finished**. It is recorded honestly rather than left for the
examiner to discover.

| Item | Why it matters |
|---|---|
| **The recovery route is broken** | The web address that performs recovery calls an old function that no longer exists. Every other part of this phase is correct, but this one endpoint fails when used |
| **The full recovery sequence is never triggered** | The component that waits, checks, decides, recovers and measures was written but is not yet connected to the web interface |
| **The three safeguards are not yet active in practice** | They are implemented and available, but the working endpoint still uses the old decision method, so they never run |
| **Pod readiness is measuring the wrong thing** | One route measures processor load but labels it as "pod readiness". Readiness should mean how many copies are ready to serve |
| **One route returns a misleading label** | The field called "raw check" actually contains the calculated score, and the actual measurement is discarded |
| **No tests for the recovery decisions** | The three safeguards have no automated tests yet, although they are pure logic and easy to test |
| **One test is not testing what its name claims** | A test named for one thing checks another. The case it was meant to cover is currently unprotected |
| **A misspelled file name** | The central component's file name contains a typo. Everything references it consistently so it works, but it should be corrected |
| **A misspelled label in the output** | One of the four score labels is misspelled. It will be visible on the dashboard |

**The first item is the important one.** It is a small fix, and it is the single endpoint that
represents the central claim of the entire project.

---

## What the Next Phase Builds On

- The health score, which the dashboard will display as a chart
- The recorded recovery times, which feed the performance report
- The decision reasons, which will be shown to the user so no action appears unexplained
- The measurement window, which can later be given its own adjustable duration