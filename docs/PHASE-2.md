# Phase 2 — Making the Pipeline Real

**Project:** Cloud-Based Self-Healing DevOps Deployment Platform
**Style:** Plain language, no code. Readable by anyone without a technical background.

---

## Why This Phase Was Needed

After Phase 1 the platform looked complete on the outside but did not actually do much. It reported
deployments as successful without checking anything. It never downloaded anyone's code. Its "run
tests" step always passed. It could only ever release one specific application, no matter what had
been registered.

This phase replaced those placeholders with parts that genuinely work.

---

## What We Built

Four components joined into one continuous chain:

> **Download the code → check it → package it → store it → release it**

---

### 1. The Image Library

**First, what an "image" is.**

When a program is packaged so it runs identically everywhere, the result is called a container image.
Think of a sealed box: inside is the program plus everything it needs — the engine, the libraries,
the settings. Wherever the box is opened, it behaves the same way. This is what removes the "but it
worked on my computer" problem.

**What we built.**

A component that builds these boxes and files them in a private library, called a container registry,
running inside the local cluster.

**The single most important decision.**

Every version is filed under a label taken from its commit code — never a generic label like
"latest".

Here is why, in plain terms. Suppose "latest" always points at the newest build. You release a version
that turns out to be broken, so the system tries to undo it. But "latest" now points at the broken
version — so the undo puts the broken version straight back, and nothing has actually been fixed.

By filing each build under its own permanent name, every version stays retrievable forever. Undoing a
release always has something valid to return to. **This one decision is what makes automatic recovery
possible at all.**

---

### 2. The Code Reader

**What it does.**

Downloads a copy of a registered project from GitHub into a private working folder, then reads three
facts about it:

- which exact version was downloaded
- when that version was written
- which branch it came from

**Why the timestamp matters.**

That "when it was written" detail is what later lets the platform answer a question examiners care
about: **how long does it take, from a developer writing code, to that code going live?**

That measurement is called "lead time" — one of the four industry-standard measures of delivery
performance. Without recording this moment the number cannot be calculated honestly, and an invented
number is worse than no number at all.

**A safety check.**

The repository address is supplied by a user, so it is checked before use. Only the four normal forms
of repository address are accepted. This stops someone submitting an address designed to reach parts
of the computer that have nothing to do with version control.

---

### 3. The Test Checker

**The problem.**

The original "run tests" step always reported success. It never ran anything. Claiming to run tests
without running tests is exactly the kind of thing that does not survive questioning.

**What we did.**

We wrote genuine automated tests for the sample application — small automatic checks confirming the
program's basic logic behaves correctly. They now run before anything is released.

**A deliberate design choice.**

If a project contains no tests at all, the platform currently allows it through and says so out loud.
A stricter design would block it entirely, on the grounds that untested code should not go live.

Both are defensible. Ours favours easy demonstration; the stricter one favours safety. Either way this
is a trade-off to state openly rather than pretend was never considered.

**What this buys you.**

A broken version can now be stopped **before it ever reaches users**. The pipeline halts at the testing
step, so the faulty version is never released. That is prevention.

But prevention is not the whole story. Some faults only appear once a program is actually running and
carrying real traffic. That is what Phase 3 handles.

---

### 4. The Release Controller

**What it does.**

Reads the deployment description file, swaps in the newly built image, and hands the result to the
cluster. The description is treated as a **template** rather than a fixed instruction, so the same
process can release any application.

**Two details worth knowing.**

**Describing rather than commanding.** The platform states what it wants — "this application, running
this many copies, on this port" — and Kubernetes works out the steps itself. Stating a desired outcome
rather than issuing instructions is what allows the same command to be repeated safely, as many times
as needed. This idea underlies every automated deployment system that exists.

**Loading every section of the file.** A deployment description usually holds more than one section —
the application itself, and the network address connecting to it. The tool used to read these files
returns only the first section unless specifically told otherwise, and it does so with no warning at
all. This is an easy trap: the application starts, but the address connecting to it never appears, and
the reason is not obvious.

---

## Putting It Together

The pipeline now runs this chain, stopping at the first failure:

1. Download the code from the repository
2. Record what was downloaded, and when it was written
3. Build the runnable package
4. Run the tests
5. File the package in the image library
6. Release it to the cluster
7. Record the result — including which step failed, if any

Every run is saved to the database with the commit, the branch, the outcome, the failing step, and how
long it took. This record is what later powers the performance reporting.

---

## What Can Be Done Now

- A student's GitHub repository can be registered and deployed for real
- The code is genuinely downloaded, tested and packaged
- Every release is stored permanently, so undoing a release is genuinely possible
- The platform no longer depends on one specific application
- Broken code can be caught before users ever see it

---

## Problems We Hit Along the Way

**The sample application kept restarting.**

It was stuck in a permanent restart loop, restarting dozens of times, because it depended on a
database it could not reach. Its design meant the server only began listening *after* the database
connection succeeded — so when the connection failed, the program simply gave up and exited.

Worth noticing: the container was reported as "Running" despite being useless. It did not crash, so
nothing raised an alert. It just sat there refusing connections.

**The fix.** The dependency on the database was removed from the test fixture. The application now
runs on its own, which removed the failure, removed the extra memory cost, and removed the need for an
internet connection during demonstrations.

**The local cluster stopped unexpectedly.**

The development machine has only 7 GB of memory — quite small for running a cluster, a monitoring
system, a dashboard and an application at the same time. The cluster was found stopped, most likely
because the machine ran out of memory.

This is not a fault in the project. It is a real and predictable consequence of the available
hardware, and it is recorded here because it limits how much can safely run at once. Two technologies
planned for later — a log viewer and a tracing tool — were deliberately left out precisely because
they would not fit.

---

## Still Outstanding

| Item | Why it matters |
|---|---|
| No version history saved | The project has never been committed to Git, so past work cannot be restored if something goes wrong |
| One leftover empty database migration | Harmless but untidy; an examiner may ask why two exist |
| A placeholder setup file still empty | The local development setup file was never filled in |
| Hard-coded application name in the health check | The monitoring code still refers to one specific application by name, breaking the promise that any application can be deployed |
| Project records missing key details | The platform does not store the port or health-check address per project, because the sample application happened to use the same ones every time |
| Login and roles not started | User accounts, and the difference between administrator and developer, are still to be built |

---

## What the Next Phase Builds On

- The image library, which makes undoing a release possible
- The saved record of every pipeline run, which the performance report will be built from
- The release controller, which the automatic recovery system sits on top of
- The genuine test results, which give the pipeline something real to protect