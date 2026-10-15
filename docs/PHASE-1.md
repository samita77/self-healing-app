# Phase 1 — Foundation Hardening

**Project:** Cloud-Based Self-Healing DevOps Deployment Platform
**Style:** Plain language, no code. Readable by anyone without a technical background.

---

## What This Phase Was About

Phase 1 added **no new features**. Every change was a bug fix, a safety correction, or missing
basic setup.

The reason matters. A platform that claims to run tests but never runs them, or that contains one
person's computer address written into it, will not work on anybody else's machine. Phase 1 exists so
that every claim the project makes is actually backed by working code.

---

## The Problems We Found

| Problem | In plain terms | How bad |
|---|---|---|
| Duplicate route registration | The same set of web addresses was defined twice | Low |
| Hard-coded computer address | A file path belonging to one specific laptop was written into the program | **Critical** |
| Broken cluster command | A flag was used that does not exist, so that function could never have worked | High |
| Yes/No stored as text | A result that is either true or false was being saved as words | Medium |
| Database tables created automatically | The program made its own tables, which cannot be changed or undone | High |
| An empty module file | A file that should have held something important was completely blank | Medium |
| Three blank files | The packaging, setup and configuration files were empty | High |
| No database in the cluster | The application depended on a database that did not exist | **Critical** |

---

## What Was Fixed, and Why

### 1. The hard-coded computer address

**The problem.** One file contained a full path to a specific person's laptop — something like
"open this exact location on this exact machine". On any other computer that location does not exist,
so the feature simply failed.

**The fix.** The program now works out its own location by looking at where its own files sit, and
builds the path from there. It no longer depends on where it happens to be run from.

**Why this matters more than it looks.** A path written as a shortcut works only if the program is
started from one specific folder. Starting it from a different folder — or from inside a container,
which always starts in its own place — breaks it silently. Making a program find its own files is what
makes it portable.

---

### 2. A broken cluster command

**The problem.** One function asked the cluster for status using a flag that does not exist, so it
would have failed every single time. It also only ever looked at the **first** running copy of the
application, ignoring the others.

**The fix.** The correct flag is now used, and every copy is checked. A timeout was also added so the
program cannot hang forever if the cluster becomes unreachable.

**Why it matters.** With several copies running, checking only the first one means a problem affecting
the other copies goes completely unnoticed. That is precisely the kind of blind spot a self-healing
system must not have.

---

### 3. A yes/no result stored as text

**The problem.** A field recording whether a recovery succeeded was declared to hold text. The code
even went out of its way to convert the answer into words before saving it.

**Why it is wrong.** A question like "how many recoveries failed?" then cannot be answered properly —
the database would have to compare words instead of a real true/false value. Slower, and fragile.

**The fix.** The field now holds a proper yes/no value.

---

### 4. Tables created automatically, with no record of changes

**The problem.** The program was creating its database tables every time it started.

**Why this is a problem.** It only ever creates tables that are *missing*. If a field changes type, or
a new field is added, this approach does nothing at all and says nothing. There is also no history —
you cannot ask when something changed, and you cannot undo a change.

**The fix.** Changes to the database are now written down as numbered, dated steps — like a logbook.
There is a command to apply the next step, and a command to undo the last one. The first step was
already applied: it created the missing table for tracking pipeline runs, and corrected the field from
Step 3 above.

**Why this matters — and this one is worth demonstrating in a viva.**

This actually happened in our own project, which makes it easy to explain. The program created its
tables the old way. We then changed a field in the code from text to yes/no. **The database did not
change at all** — the automatic method silently ignored it, because the table already existed. Only
when the logbook system was introduced did the difference get detected and applied.

Without the logbook system, that field would still be the wrong type today, and the failure would have
surfaced later as a confusing database error with no visible connection to the change that caused it.

---

### 5. An empty file that should not have been empty

**The problem.** One file — meant to record pipeline runs — was completely blank. A blank file
contains no instructions, so the new system simply did not know that part of the program existed. It
skipped it without complaint.

**The fix.** The file now describes what must be recorded: the version of code, the branch, the
outcome, which step failed, and how long it took. That record is what the performance report will
later be built from.

---

### 6. Three blank files

**The packaging file.** Instructions for building the program into a runnable form. It was empty.

**The setup file.** Instructions for running the whole system on one machine. It was empty.

**The example configuration file.** A template showing which settings are needed, without any real
secrets in it. It was empty.

All three are now filled in.

**One detail worth explaining.** In the packaging instructions, dependencies are installed *before* the
program's own code is copied in. This is deliberate. A container image is built in layers, and a layer
is only reused if nothing above it changed. Putting the large dependency download first means editing
the program does not force it to download everything again. Get the order wrong and every small code
change costs minutes instead of seconds.

**Another detail.** The command that starts the program is written in a special form that makes it the
main process in the container. This matters because Kubernetes asks applications to shut down cleanly
before stopping them, and only the main process receives that request. In the more common form, the
request is swallowed and the application is killed abruptly, potentially mid-request. This becomes
important the moment you demonstrate rolling updates and rollbacks, since a rollback stops running
applications.

---

### 7. No database in the cluster — the one that would have broken the demonstration

**The problem.** The test application needed a database. It was not running in the cluster. The
connection settings pointed at one, but nothing was there.

**Why this would have broken everything.**

The test application was designed so it only began listening for requests **after** it successfully
connected to the database. When the connection failed, it logged the problem and stopped — without
ever opening for requests.

Critically, **it did not crash**. A program that exits cleanly looks healthy to the cluster, so nothing
raised an alert. The application sat there reporting "Running" while refusing every connection.

Every health check would have failed. The health score would have collapsed every single time. The
automatic recovery system would then have correctly concluded that every deployment was broken — and
rolled back every release, forever, without ever fixing anything.

**The fix.** A database was added to the cluster so the application can actually start.

**A lesson recorded.** In a single-machine setup, storage is kept directly on that machine so data
survives a restart. Storage that disappears when a component restarts would have looked fine during
testing but silently destroyed data during a live demonstration. On a real multi-machine system this
would need proper network storage instead — a limitation worth stating openly rather than hiding.

---

## What Can Be Done Now

- The program runs on any computer, not just the one it was written on
- The database structure is versioned, changeable, and reversible
- The application being used for testing can actually start and pass its health check
- Everything needed to package and run the project exists and is filled in

---

## Still Outstanding

| Item | Why it matters |
|---|---|
| No version history saved | Nothing has been committed yet, so earlier work cannot be restored |
| Two nearly identical database log entries | One is an empty leftover and should be removed |
| Setup file still empty | The one-machine setup file was never written |
| Example configuration file has a slightly wrong label | Harmless now, but would cause a startup failure if copied as-is |
| Real cloud database credentials not yet stored | The database connection settings are still placeholders |
| Password stored openly | Needs to be changed before the final presentation |

---

## What the Next Phase Builds On

- The portable file locations, which every later deployment will rely on
- The database logbook, which every new table will be recorded in
- The working test application, which every deployment will be tested against
- The health check, which the next phase transforms into the self-healing system