// Code-based rule test runner. Run with `npm test`.
import { SAMPLE_ROOMS } from '../src/lib/roomData';
import {
  checkAvailability,
  DEFAULT_CURRENT_TIME,
  DEFAULT_START,
  DEFAULT_DURATION,
  type AvailabilityResult,
  type ReasonCode,
  type Room,
} from '../src/lib/availability';
import { buildTestCases } from '../src/lib/testVectors';

const baseRoom = SAMPLE_ROOMS[0];

// Reuse the SAME shared vectors as the low-code runner for T1-T7.
const sharedCases = buildTestCases(baseRoom);

let failures = 0;
function report(id: string, description: string, res: AvailabilityResult, pass: boolean, expectCode: ReasonCode, extra = '') {
  if (!pass) failures += 1;
  console.log(
    `${pass ? 'PASS' : 'FAIL'}  ${id}  ${description} (expect ${expectCode})\n` +
    `      got: available=${res.available} reasonCode=${res.reasonCode} message="${res.message}"` +
    (extra ? `\n      ${extra}` : '')
  );
}

for (const tc of sharedCases) {
  const res = checkAvailability(tc.room, tc.currentTime, tc.start, tc.duration);
  const pass = res.reasonCode === tc.expectCode && res.available === (tc.expectCode === 'OK');
  report(tc.id, tc.description, res, pass, tc.expectCode);
}

// T8 — deep-check: calling checkAvailability must not mutate room.bookings
const t8room: Room = JSON.parse(JSON.stringify({ ...baseRoom, blocked: false }));
const before = JSON.stringify(t8room.bookings);
checkAvailability(t8room, DEFAULT_CURRENT_TIME, DEFAULT_START, DEFAULT_DURATION);
const after = JSON.stringify(t8room.bookings);
const t8pass = before === after;
report(
  'T8',
  'Booking data unchanged after rule call (deep check)',
  { available: t8pass, reasonCode: t8pass ? 'OK' : 'BAD_INPUT', message: t8pass ? 'bookings unchanged' : 'bookings changed' },
  t8pass,
  'OK',
  t8pass ? 'room.bookings untouched' : `before=${before} after=${after}`
);

console.log(failures === 0 ? '\nAll tests passed.' : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
