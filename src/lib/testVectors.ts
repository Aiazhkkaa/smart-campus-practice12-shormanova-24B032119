import type { ReasonCode, Room } from './availability';

/**
 * Single source of truth for the rule test vectors. BOTH the code-based
 * runner and the simulated low-code runner MUST consume these same cases —
 * that is what makes the comparison fair.
 */
export interface RuleTestCase {
  id: string;
  description: string;
  room: Room;
  currentTime: number;
  start: number;
  duration: number;
  expectCode: ReasonCode;
}

export function buildTestCases(baseRoom: Room): RuleTestCase[] {
  const unblocked: Room = { ...baseRoom, blocked: false };
  const blocked: Room = { ...baseRoom, blocked: true, blockReason: 'Blocked for testing' };
  return [
    { id: 'T1', description: 'Free slot 720+45',        room: unblocked, currentTime: 570, start: 720, duration: 45,  expectCode: 'OK' },
    { id: 'T2', description: 'Overlap existing 630+60', room: unblocked, currentTime: 570, start: 630, duration: 60,  expectCode: 'OVERLAP' },
    { id: 'T3', description: 'Blocked room 720+45',     room: blocked,   currentTime: 570, start: 720, duration: 45,  expectCode: 'ROOM_BLOCKED' },
    { id: 'T4', description: 'Zero duration 660+0',     room: unblocked, currentTime: 570, start: 660, duration: 0,   expectCode: 'BAD_DURATION' },
    { id: 'T5', description: 'Too long 660+121',        room: unblocked, currentTime: 570, start: 660, duration: 121, expectCode: 'BAD_DURATION' },
    { id: 'T6', description: 'Past 540+50',             room: unblocked, currentTime: 570, start: 540, duration: 50,  expectCode: 'IN_PAST' },
    { id: 'T7', description: 'Adjacent 660+60',         room: unblocked, currentTime: 570, start: 660, duration: 60,  expectCode: 'OK' },
  ];
}
