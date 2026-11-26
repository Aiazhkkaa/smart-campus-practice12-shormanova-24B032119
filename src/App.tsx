import { useMemo, useState } from 'react';
import { Building2, Clock, DoorClosed, Timer, ShieldAlert, ClipboardCheck } from 'lucide-react';
import { SAMPLE_ROOMS } from '@/lib/roomData';
import {
  checkAvailability,
  DEFAULT_CURRENT_TIME,
  DEFAULT_START,
  DEFAULT_DURATION,
  type AvailabilityResult,
  type ReasonCode,
  type Room,
} from '@/lib/availability';
import { Timeline, ResultBanner } from '@/components/Timeline';
import LowCodeLab from '@/components/LowCodeLab';

function minutesToLabel(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

const MIN = 0;
const MAX = 1440;

const numberInputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

interface AppProps {
  /** Overridden only by the test harness; defaults to a live editable room. */
  roomOverride?: Room | null;
}

export default function App({ roomOverride }: AppProps = {}) {
  const [blocked, setBlocked] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(String(DEFAULT_CURRENT_TIME));
  const [startStr, setStartStr] = useState<string>(String(DEFAULT_START));
  const [durationStr, setDurationStr] = useState<string>(String(DEFAULT_DURATION));

  // The single fictional room. The Blocked checkbox acts on this room in
  // memory only; the underlying SAMPLE_ROOMS data is never mutated.
  const room: Room = useMemo(() => {
    if (roomOverride !== undefined) return roomOverride as Room;
    const base = SAMPLE_ROOMS[0];
    return { ...base, blocked };
  }, [blocked, roomOverride]);

  const currentTime = Number(currentTimeStr);
  const start = Number(startStr);
  const duration = Number(durationStr);
  const inputsValid =
    currentTimeStr.trim() !== '' &&
    startStr.trim() !== '' &&
    durationStr.trim() !== '' &&
    [currentTime, start, duration].every((n) => Number.isFinite(n));

  const result: AvailabilityResult | null = useMemo(() => {
    if (!inputsValid) return null;
    return checkAvailability(room, currentTime, start, duration);
  }, [room, currentTime, start, duration, inputsValid]);

  const intervalValid =
    result !== null &&
    ['OK', 'IN_PAST', 'BAD_DURATION', 'ROOM_BLOCKED', 'OVERLAP'].includes(result.reasonCode);

  const end = start + duration;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Building2 className="h-4 w-4" />
            Smart Campus
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Room Availability Checker
          </h1>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Pick a time slot (in minutes from midnight) and see whether the room is available. This
            is a demo — no booking is saved.
          </p>
        </header>

        <div className="grid gap-6">
          {/* Inputs card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <DoorClosed className="h-5 w-5 text-slate-500" />
              Check {room.name}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Blocked checkbox */}
              <div className="sm:col-span-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={room.blocked}
                    onChange={(e) => setBlocked(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                  />
                  Room is blocked
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                </label>
              </div>

              {/* Current time */}
              <div>
                <label htmlFor="current" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Current time (min)
                </label>
                <input
                  id="current"
                  type="number"
                  min={MIN}
                  max={MAX}
                  value={currentTimeStr}
                  onChange={(e) => setCurrentTimeStr(e.target.value)}
                  className={numberInputClass}
                />
                {Number.isFinite(currentTime) && currentTimeStr.trim() !== '' && (
                  <p className="mt-1 text-xs text-slate-400">{minutesToLabel(currentTime)} HH:MM</p>
                )}
              </div>

              {/* spacer for alignment */}
              <div className="hidden sm:block" />

              {/* Start */}
              <div>
                <label htmlFor="start" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Timer className="h-4 w-4 text-slate-400" />
                  Start (min)
                </label>
                <input
                  id="start"
                  type="number"
                  min={MIN}
                  max={MAX}
                  value={startStr}
                  onChange={(e) => setStartStr(e.target.value)}
                  className={numberInputClass}
                />
                {Number.isFinite(start) && startStr.trim() !== '' && (
                  <p className="mt-1 text-xs text-slate-400">{minutesToLabel(start)} HH:MM</p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="duration" className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <Timer className="h-4 w-4 text-slate-400" />
                  Duration (min, 1–120)
                </label>
                <input
                  id="duration"
                  type="number"
                  min={1}
                  max={120}
                  value={durationStr}
                  onChange={(e) => setDurationStr(e.target.value)}
                  className={numberInputClass}
                />
                {Number.isFinite(duration) && durationStr.trim() !== '' && (
                  <p className="mt-1 text-xs text-slate-400">
                    End: {Number.isFinite(end) ? minutesToLabel(end) : '—'} (start + duration)
                  </p>
                )}
              </div>
            </div>

            {/* Inline field-level validation hints */}
            {!inputsValid && (
              <p className="mt-3 text-sm text-amber-600">Please fill in all three time fields with numbers.</p>
            )}
            {inputsValid && result && ['BAD_INPUT', 'NOT_INTEGER', 'OUT_OF_RANGE'].includes(result.reasonCode) && (
              <p className="mt-3 text-sm text-amber-600">{result.message}</p>
            )}
          </section>

          {/* Result */}
          {result && <ResultBanner result={result} />}

          {/* Room detail card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{room.name}</h2>
                <p className="text-sm text-slate-500">{room.building}</p>
              </div>
              {room.blocked ? (
                <span className="flex-none rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                  Blocked
                </span>
              ) : (
                <span className="flex-none rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              )}
            </div>

            {room.blocked && room.blockReason && (
              <p className="mt-2 text-sm text-red-600">{room.blockReason}</p>
            )}

            {/* Timeline */}
            <div className="mt-5">
              <Timeline
                room={room}
                candidateStart={intervalValid ? start : null}
                candidateEnd={intervalValid ? end : null}
              />
            </div>

            {/* Existing bookings list */}
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Existing bookings</h3>
              {room.bookings.length === 0 ? (
                <p className="text-sm text-slate-400">No existing bookings.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {room.bookings.map((b, i) => (
                    <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-slate-700">{b.label}</span>
                      <span className="font-mono text-slate-500">
                        {minutesToLabel(b.start)}–{minutesToLabel(b.end)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <TestPanel room={room} currentTime={currentTime} />

          <LowCodeLab />

          <footer className="pt-2 text-center text-xs text-slate-400">
            Times are in minutes from midnight (0–1440). Fictional data for coursework only.
          </footer>
          <footer className="pt-1 pb-4 text-center text-xs text-slate-500">
            Coursework: Lesson 12 Practice — Shormanova Ayazhan, 24B032119
          </footer>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test results panel — actually invokes checkAvailability for each case.
// ---------------------------------------------------------------------------

interface TestCase {
  id: string;
  description: string;
  room: Room;
  currentTime: number;
  start: number;
  duration: number;
  expectCode: ReasonCode;
}

function buildTestCases(room: Room): TestCase[] {
  // Kept in sync with src/lib/testVectors.ts (shared with the low-code runner).
  const unblockedRoom = { ...room, blocked: false };
  const blockedRoom: Room = {
    ...room,
    blocked: true,
    blockReason: 'Blocked for testing',
  };
  return [
    { id: 'T1', description: 'Free slot',        room: unblockedRoom, currentTime: 570, start: 720, duration: 45,  expectCode: 'OK' },
    { id: 'T2', description: 'Overlap existing', room: unblockedRoom, currentTime: 570, start: 630, duration: 60,  expectCode: 'OVERLAP' },
    { id: 'T3', description: 'Blocked room',     room: blockedRoom,   currentTime: 570, start: 720, duration: 45,  expectCode: 'ROOM_BLOCKED' },
    { id: 'T4', description: 'Zero duration',    room: unblockedRoom, currentTime: 570, start: 660, duration: 0,   expectCode: 'BAD_DURATION' },
    { id: 'T5', description: 'Too long',         room: unblockedRoom, currentTime: 570, start: 660, duration: 121, expectCode: 'BAD_DURATION' },
    { id: 'T6', description: 'Start in past',    room: unblockedRoom, currentTime: 570, start: 540, duration: 50,  expectCode: 'IN_PAST' },
    { id: 'T7', description: 'Adjacent slot',    room: unblockedRoom, currentTime: 570, start: 660, duration: 60,  expectCode: 'OK' },
    { id: 'T8', description: 'Booking data unchanged (deep check)', room: unblockedRoom, currentTime: 570, start: 660, duration: 60, expectCode: 'OK' },
  ];
}

function TestPanel({ room, currentTime }: { room: Room; currentTime: number }) {
  const testCases = useMemo(() => buildTestCases(room), [room]);
  const [expanded, setExpanded] = useState(true);

  const runTests = (): { id: string; description: string; pass: boolean; detail: string }[] => {
    return testCases.map((tc) => {
      let pass = false;
      let detail = '';
      if (tc.id === 'T8') {
        // deep-check that calling the rule function does not mutate room.bookings
        const before = JSON.stringify(tc.room.bookings);
        checkAvailability(tc.room, tc.currentTime, tc.start, tc.duration);
        const after = JSON.stringify(tc.room.bookings);
        pass = before === after;
        detail = pass
          ? 'room.bookings unchanged after checkAvailability'
          : `room.bookings changed! before=${before} after=${after}`;
      } else {
        const res = checkAvailability(tc.room, tc.currentTime, tc.start, tc.duration);
        pass = res.reasonCode === tc.expectCode && res.available === (tc.expectCode === 'OK');
        detail = `reasonCode=${res.reasonCode}, message="${res.message}"`;
      }
      return { id: tc.id, description: tc.description, pass, detail };
    });
  };

  const results = runTests(); // run on every render so the panel is always live
  const allPass = results.every((r) => r.pass);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ClipboardCheck className="h-5 w-5 text-slate-500" />
          Test results
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
              allPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {results.filter((r) => r.pass).length}/{results.length} passing
          </span>
        </h2>
        <span className="text-sm text-slate-400">{expanded ? 'Hide' : 'Show'}</span>
      </button>

      {expanded && (
        <ul className="mt-4 space-y-1.5">
          {results.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-2 py-1.5 text-sm odd:bg-slate-50"
            >
              <span className={`font-mono text-xs font-semibold ${r.pass ? 'text-emerald-700' : 'text-rose-700'}`}>
                {r.pass ? 'PASS' : 'FAIL'}
              </span>
              <span className="font-mono text-xs text-slate-500">{r.id}</span>
              <span className="text-slate-700">{r.description}</span>
              <span className="w-full font-mono text-xs text-slate-400 sm:w-auto sm:ml-auto">{r.detail}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-slate-400">
        Tests run live on every render against the rule function, using simulated current time
        {' '}{minutesToLabel(currentTime)} ({currentTime} min).
      </p>
    </section>
  );
}
