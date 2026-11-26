import type { Room } from './availability';

// Single fictional room. All data here is fabricated for coursework —
// it is NOT real room, building or course information (see AGENTS.md).
export const SAMPLE_ROOMS: Room[] = [
  {
    id: 'room-a',
    name: 'Study Room A',
    building: 'Library, Floor 2 (fictional)',
    blocked: false,
    bookings: [
      { start: 600, end: 660, label: 'CS101 Study Group' },
    ],
  },
];

export const BLOCKED_ROOM_LABEL = 'Blocked (test only)';
