# Room Availability Checker — Lesson 12 Practice

**Student:** Shormanova Ayazhan, 24B032119

This project contains **two independently verifiable implementations** of the same
room availability rule set, sharing one fictional room fixture, one input/output
contract, and one shared set of T1–T8 test vectors.

| Approach | Where | Runs how | Tests |
|---|---|---|---|
| Code-based (React + TypeScript) | `src/App.tsx`, `src/lib/availability.ts` | Hand-written rule function | `npm run test:rules` |
| Simulated low-code (declarative JSON + generic interpreter) | `src/components/LowCodeLab.tsx`, `src/lib/workflowInterpreter.ts`, `src/lib/workflow.json` | Declarative workflow JSON, executed by a small generic interpreter (no `eval`, no `new Function`) | `npm run test:workflow` |

**The low-code approach is a simulation built in Bolt.** It is explicitly
labelled as such in the UI (amber "Simulated low-code workflow (built in
Bolt)" badge) and in every file that touches it. It is **not** evidence of
real Appsmith, Power Apps, or any other visual low-code platform use — no
screenshots, exports, or platform accounts were produced.

All data in this project is **fictional coursework data**. Room names,
buildings, bookings and times do not represent any real location or schedule.

## Baseline (as found, before any of this work)

The starter project already contained a room availability checker:

- `src/lib/availability.ts` — pure rule function `checkAvailability(room, currentTime, start, end)`
  taking an **end** minute (not duration), returning a union
  `{ available: true } | { available: false, reason: string }`.
  Rules: finite input, 0 ≤ start < end ≤ 1440, start after now, max 120 min,
  room not blocked, no overlap (touching allowed).
- `src/lib/roomData.ts` — **three** rooms: Study Room A (booking 600–660),
  Lab Room B (2 bookings), Seminar Room C (blocked: true).
- `src/App.tsx` — room dropdown, numeric inputs for current time / start / end,
  result banner, existing-bookings list. No blocked checkbox, no test panel.
- `src/components/Timeline.tsx` — 24-hour visual timeline + result banner.

## Baseline behaviour preserved and reused

- Booking 600–660 on Study Room A exists and is never modified (asserted by T8).
- Default simulated "now" = 570 (09:30). Default start = 660, duration = 60 (end = 720).
- Adjacent slots (e.g. 660 start right after a 660 end) remain allowed.

## What this task changed

- Reduced data to **one fictional room**, Study Room A, booking 600–660 only.
- Input is now **start + duration**; end is computed as `start + duration`.
- Added a **Blocked checkbox** acting on that same room (in-memory only).
- Rule function refactored into clearly separated validation, calculation and
  rendering layers, returning a flat `{ available, reasonCode, message }`.
- Added a **second, simulated low-code implementation** — a visible form with
  read-only workflow step cards, driven by `workflow.json` and a small generic
  interpreter. It reuses the same one-room fixture and the same
  `{ available, reasonCode, message }` output contract. Its workflow checks are
  kept entirely separate from the code-based calculation path.
- Added an in-app **Test results panel** for each implementation and an
  automated `npm test` command covering both.
- Added accessible status feedback (`role="status"`, `aria-live="polite"`).
- Added a coursework footer with student name and ID.

## Acceptance criteria

- AC1: start must be strictly after the current time (simulated "now").
- AC2: duration must be an integer 1..120 minutes.
- AC3: overlapping an existing booking is rejected; adjacency is allowed.
- AC4: a blocked room rejects any booking.
- AC5: a clear decision is shown without changing existing bookings.
- AC6: validation messages are understandable and the UI is responsive.
- Time values must be finite integer minutes in 0..1440.

## Verification

```bash
npm test         # both runners: 8 code-based + 8 low-code-simulated cases
npm run build    # production build
npm run lint     # eslint
npm run typecheck
```

See AGENTS.md for scope, conventions and NOT-RUN reporting rules. See the
Comparison note below for what the simulated low-code workflow does and does
not demonstrate.

## Comparison note (honest record)

**Actual test counts, verified by running `npm test`:**

- Code-based implementation: **8 tests, 8 passed, 0 failed.**
- Simulated low-code implementation: **8 tests, 8 passed, 0 failed.**

Both consume the **same shared vectors** (`src/lib/testVectors.ts`) — T1 free
slot, T2 overlap, T3 blocked, T4 zero duration, T5 too long, T6 past, T7
adjacent, T8 deep data-unchanged check — so the comparison is like-for-like on
rule behaviour, not on implementation code.

**Simulation limitations (do not over-claim):**

- The "low-code" path is **not** a real low-code platform. It is a declarative
  JSON document plus a hand-written generic interpreter running inside this
  same React codebase. There is no visual drag-and-drop editor, no platform
  runtime, no Appsmith/Power Apps artefact, and no external deployment.
- The workflow JSON is a configuration **simulating** what a low-code builder
  would generate, not something produced by one.
- The interpreter supports only a small set of step kinds (`guard`, `compare`,
  `range`, `flag`, `overlap`, `success`) — enough for this rule set, nothing
  more. It does not demonstrate the breadth of a real low-code platform.
- No user accounts, no persistence, no network calls — same constraints as the
  code-based path.

**Setup and build times: unmeasured.** No timer was used for either the
code-based or the simulated low-code path, so no time comparison is claimed.
Any statement about relative build effort would be fabricated and is not made.

**Export and versioning, actually verified in this repo:**

- The low-code workflow is "exportable" only as its source JSON file
  (`src/lib/workflow.json`), committed alongside the code. There is no
  platform package, `.app`, `.zip`, or vendor-specific export format.
- Versioning is plain text-file version control in this repo (no git history
  is present in this snapshot — `Is directory a git repo: No`). There is no
  platform-side version history to compare against.
- Therefore, no claim is made that the low-code path has comparable export or
  versioning features to a real platform. This comparison point is
  **NOT RUN** against a real low-code tool and remains honestly unresolved.

## Publishing status

Not published, not deployed, not pushed anywhere. This is an unfinished
coursework artefact pending the real low-code comparison.
