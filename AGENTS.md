# AGENTS.md

Guidance for AI agents working in this repository.

## Project scope

Single-purpose coursework deliverable: a **room availability checker** for one
fictional study room. Checks whether a proposed start+duration slot can be
booked. Deliberately excluded: authentication, database, any application-level
network API, real booking persistence, multi-room management.

Implementation types, kept side by side and separately testable:

1. **Code-based** (React + TypeScript, built with Bolt) — the primary path.
2. **Simulated low-code** — a declarative JSON workflow plus a small generic
   interpreter, mimicking a visual builder. It must always be labelled as a
   *simulation built in Bolt*, never presented as real Appsmith / Power Apps
   / other platform output, and never cited as evidence of low-code platform
   use. No screenshots, exports or platform artefacts may be fabricated.

## File guidance

- `src/lib/availability.ts` — pure rule layer: `Room`/`Booking` types,
  `AvailabilityResult { available, reasonCode, message }`, `validateInterval`
  (well-formed input), `checkAvailability` (booking decision). No React, no
  I/O, no mutation of its arguments.
- `src/lib/roomData.ts` — the single fictional room and its existing booking.
  Keep this data small and clearly fictional.
- `src/App.tsx` — UI shell, inputs (current time / start / duration / blocked
  checkbox), result banner, in-app test results panel.
- `src/components/Timeline.tsx` — rendering only: timeline visual + status
  banner. No business rules here.
- `src/lib/workflow.json` — the simulated low-code workflow definition.
- `src/lib/workflowInterpreter.ts` — generic declarative interpreter for that
  JSON (no `eval`, no `new Function`). Must stay generic and data-driven.
- `src/components/LowCodeLab.tsx` — the visible simulated low-code form and
  read-only workflow cards. Must keep the "Simulated low-code workflow (built
  in Bolt)" label visible.
- `src/lib/testVectors.ts` — shared T1–T8 vectors. Both implementations must
  consume these same cases; do not fork them.
- `scripts/test-rules.ts`, `scripts/test-workflow.ts` — the two runners,
  chained by `npm test`.
- `README.md` — baseline record, comparison note, how to run.
- `AGENTS.md` — this file.

Keep validation, calculation and rendering in these separate layers. Do not
move rule logic into components or into data files.

## Fictional data rules

- All rooms, buildings, courses, bookings and times are fabricated for
  coursework. Never substitute real names, real timetables or real locations.
- Never claim the data represents an actual institution.
- Never mutate the existing booking (600–660) at runtime; test T8 asserts this.

## No secrets

- Do not commit or hardcode API keys, tokens, connection strings or
  credentials of any kind. This project intentionally needs none.
- Do not add network calls that would require such secrets.

## Verification commands

```bash
npm test           # both runners: code-based (T1–T8) + simulated low-code (T1–T8)
npm run test:rules # code-based only
npm run test:workflow # simulated low-code only
npm run typecheck  # TypeScript
npm run lint       # eslint
npm run build      # production build
```

Run these before declaring any change finished, and report actual output.
If a check was not executed, say **NOT RUN** explicitly next to that check.
Never report a check as passing without having run it.

## Publishing

Do not publish, deploy, or push anywhere. This is an unfinished coursework
artifact: the real low-code platform comparison is still pending, and the
in-repo low-code path is a simulation only.
