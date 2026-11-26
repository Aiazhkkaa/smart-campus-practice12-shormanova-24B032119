import type { AvailabilityResult, Booking, Room } from '@/lib/availability';

function minutesToLabel(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

interface TimelineProps {
  room: Room;
  candidateStart: number | null;
  candidateEnd: number | null;
}

/**
 * Visual 24-hour timeline (0–1440). Shows existing bookings as blocks
 * and, if a valid candidate is entered, where it would fall.
 */
export function Timeline({ room, candidateStart, candidateEnd }: TimelineProps) {
  const blocks: { start: number; end: number; kind: 'booked' | 'candidate' | 'blocked'; label: string }[] = [];

  if (room.blocked) {
    blocks.push({ start: 0, end: 1440, kind: 'blocked', label: room.blockReason ?? 'Blocked' });
  } else {
    room.bookings.forEach((b: Booking) => {
      blocks.push({ start: b.start, end: b.end, kind: 'booked', label: b.label });
    });
    if (
      candidateStart !== null &&
      candidateEnd !== null &&
      candidateStart < candidateEnd &&
      candidateStart >= 0 &&
      candidateEnd <= 1440
    ) {
      blocks.push({ start: candidateStart, end: candidateEnd, kind: 'candidate', label: 'Your request' });
    }
  }

  const hours = Array.from({ length: 25 }, (_, i) => (i * 60));

  return (
    <div className="w-full">
      <div className="relative h-16 w-full rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
        {blocks.map((b, i) => {
          const left = (b.start / 1440) * 100;
          const width = ((b.end - b.start) / 1440) * 100;
          const styles: Record<string, string> = {
            booked: 'bg-slate-400 text-white',
            candidate: 'bg-emerald-500 text-white',
            blocked: 'bg-red-400 text-white',
          };
          return (
            <div
              key={i}
              className={`absolute top-0 h-full flex items-center px-1.5 text-[10px] font-medium truncate ${styles[b.kind]}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${minutesToLabel(b.start)}–${minutesToLabel(b.end)}: ${b.label}`}
            >
              {minutesToLabel(b.start)}–{minutesToLabel(b.end)}
            </div>
          );
        })}
      </div>
      {/* hour axis */}
      <div className="relative h-5 mt-0.5 text-[9px] text-slate-400 select-none">
        {hours.filter((_, i) => i % 3 === 0).map((m) => (
          <span
            key={m}
            className="absolute -translate-x-1/2"
            style={{ left: `${(m / 1440) * 100}%` }}
          >
            {minutesToLabel(m)}
          </span>
        ))}
      </div>
    </div>
  );
}

interface ResultBannerProps {
  result: AvailabilityResult;
}

export function ResultBanner({ result }: ResultBannerProps) {
  if (result.available) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">✓</span>
        <div>
          <p className="font-semibold text-emerald-900">Available</p>
          <p className="text-sm text-emerald-800">This time slot is open. You can proceed to book it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
      <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-rose-600 text-white text-xs font-bold">✕</span>
      <div>
        <p className="font-semibold text-rose-900">Unavailable</p>
        <p className="text-sm text-rose-800">{result.message}</p>
      </div>
    </div>
  );
}
