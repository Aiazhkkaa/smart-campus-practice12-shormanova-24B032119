// ---------------------------------------------------------------------------
// Lesson 12 Practice — availability rules (student: Shormanova Ayazhan 24B032119)
//
// Pure rule layer. No React, no network, no mutation: validation (well-formed
// input), decision (booking rules) and presentation (message strings) are
// deliberately kept in separate sections so they can be reasoned about — and
// tested — independently.
// ---------------------------------------------------------------------------

export interface Booking {
  start: number;
  end: number;
  label: string;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  blocked: boolean;
  blockReason?: string;
  bookings: Booking[];
}

export type ReasonCode =
  | 'OK'
  | 'BAD_INPUT'
  | 'OUT_OF_RANGE'
  | 'BAD_INTERVAL'
  | 'NOT_INTEGER'
  | 'IN_PAST'
  | 'BAD_DURATION'
  | 'ROOM_BLOCKED'
  | 'OVERLAP';

/**
 * Single, flat result shape used by every caller (UI, tests, panel):
 *   available : true | false
 *   reasonCode: stable machine-readable code
 *   message   : human-readable explanation
 */
export interface AvailabilityResult {
  available: boolean;
  reasonCode: ReasonCode;
  message: string;
}

/** Default simulated "now" (10:30 in minutes from midnight). */
export const DEFAULT_CURRENT_TIME = 570;
/** Default booking start (11:00). */
export const DEFAULT_START = 660;
/** Default booking duration in minutes (1 hour). */
export const DEFAULT_DURATION = 60;

const MINUTE_MIN = 0;
const MINUTE_MAX = 1440;
const DURATION_MIN = 1;
const DURATION_MAX = 120;

// ---------------------------------------------------------------------------
// 1. Validation — is the raw input well-formed at all?
//    Finite, integer, within the day. Does NOT decide whether booking is
//    possible, only whether the question is even meaningful.
// ---------------------------------------------------------------------------

export interface Interval {
  currentTime: number;
  start: number;
  duration: number;
}

export function validateInterval(raw: Interval): AvailabilityResult | null {
  const fields: [keyof Interval, string][] = [
    ['currentTime', 'Current time'],
    ['start', 'Start'],
    ['duration', 'Duration'],
  ];
  for (const [field, label] of fields) {
    const v = raw[field];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      return {
        available: false,
        reasonCode: 'BAD_INPUT',
        message: `${label} must be a finite number.`,
      };
    }
    if (!Number.isInteger(v)) {
      return {
        available: false,
        reasonCode: 'NOT_INTEGER',
        message: `${label} must be a whole number of minutes.`,
      };
    }
    if (v < MINUTE_MIN || v > MINUTE_MAX) {
      return {
        available: false,
        reasonCode: 'OUT_OF_RANGE',
        message: `${label} must be between ${MINUTE_MIN} and ${MINUTE_MAX} minutes (0:00–24:00).`,
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 2. Calculation — the booking decision itself. Pure, no I/O, never mutates
//    the room or its existing bookings (see T8).
// ---------------------------------------------------------------------------

export function checkAvailability(
  room: Room | null,
  currentTime: number,
  start: number,
  duration: number
): AvailabilityResult {
  const bad = validateInterval({ currentTime, start, duration });
  if (bad) return bad;

  // AC1 — a booking cannot begin in the past relative to simulated "now".
  if (start <= currentTime) {
    return {
      available: false,
      reasonCode: 'IN_PAST',
      message: `Start (${start}) must be strictly after the current time (${currentTime}).`,
    };
  }

  // AC2 — duration must be between 1 and 120 minutes inclusive.
  if (duration < DURATION_MIN || duration > DURATION_MAX) {
    return {
      available: false,
      reasonCode: 'BAD_DURATION',
      message: `Duration must be between ${DURATION_MIN} and ${DURATION_MAX} minutes (requested ${duration}).`,
    };
  }

  const end = start + duration; // end = start + duration, caller supplies duration not end
  if (end > MINUTE_MAX) {
    return {
      available: false,
      reasonCode: 'OUT_OF_RANGE',
      message: `Booking would end at minute ${end}, which is past the end of the day (${MINUTE_MAX}).`,
    };
  }

  if (!room) {
    return {
      available: false,
      reasonCode: 'BAD_INPUT',
      message: 'Please select a room.',
    };
  }

  // AC4 — a blocked room accepts no bookings at all.
  if (room.blocked) {
    return {
      available: false,
      reasonCode: 'ROOM_BLOCKED',
      message: room.blockReason
        ? `Room is blocked: ${room.blockReason}`
        : 'This room is currently blocked.',
    };
  }

  // AC3 — reject any overlap with an existing booking; a candidate that
  // starts exactly when one ends (or vice versa) is allowed.
  const overlap = room.bookings.find((b) => start < b.end && end > b.start);
  if (overlap) {
    return {
      available: false,
      reasonCode: 'OVERLAP',
      message: `Overlaps existing booking "${overlap.label}" (${overlap.start}–${overlap.end}).`,
    };
  }

  return { available: true, reasonCode: 'OK', message: 'Available.' };
}

/** Convenience: same decision for a candidate interval the user typed as start+duration. */
export function checkCandidate(
  room: Room | null,
  currentTime: number,
  start: number,
  duration: number
): AvailabilityResult {
  return checkAvailability(room, currentTime, start, duration);
}

/** End minute for a given start+duration, for display only. */
export function calcEnd(start: number, duration: number): number {
  return start + duration;
}
