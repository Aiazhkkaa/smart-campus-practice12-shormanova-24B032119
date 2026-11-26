// Simulated low-code workflow runner. Run with `npm test`.
import { SAMPLE_ROOMS } from '../src/lib/roomData';
import { runWorkflow } from '../src/lib/workflowInterpreter';
import { buildTestCases } from '../src/lib/testVectors';

// T8 room clone is supplied by buildTestCases callers; runWorkflow only sees
// plain values so it cannot mutate anything.
const baseRoom = SAMPLE_ROOMS[0];
const cases = buildTestCases(baseRoom);

let failures = 0;

for (const tc of cases) {
  const input = {
    currentTime: tc.currentTime,
    start: tc.start,
    duration: tc.duration,
    blocked: tc.room.blocked,
  };
  const before = JSON.stringify(baseRoom.bookings);
  const { result, steps } = runWorkflow(input);
  const after = JSON.stringify(baseRoom.bookings);
  const dataOk = before === after;
  const pass = result.reasonCode === tc.expectCode && result.available === (tc.expectCode === 'OK') && dataOk;
  if (!pass) failures += 1;
  console.log(
    `${pass ? 'PASS' : 'FAIL'}  ${tc.id}  ${tc.description}\n` +
    `      got: available=${result.available} reasonCode=${result.reasonCode} message="${result.message}"` +
    (dataOk ? '' : `\n      room data mutated! before=${before} after=${after}`) +
    `\n      steps: ${steps.map((s) => `${s.name}=${s.status}`).join(', ')}`
  );
}

// T8 — explicit deep check that the underlying room data is untouched.
const before = JSON.stringify(baseRoom);
runWorkflow({ currentTime: 570, start: 660, duration: 60, blocked: false });
const after = JSON.stringify(baseRoom);
const t8pass = before === after;
if (!t8pass) failures += 1;
console.log(
  `${t8pass ? 'PASS' : 'FAIL'}  T8  Booking data unchanged after workflow run (deep check)\n` +
  `      room object unchanged: ${t8pass}`
);

console.log(failures === 0 ? '\nAll tests passed.' : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
