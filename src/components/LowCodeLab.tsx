import { useMemo, useState } from 'react';
import { Workflow, ClipboardList, AlertTriangle } from 'lucide-react';
import { SAMPLE_ROOMS } from '@/lib/roomData';
import { runWorkflow, workflow, type WorkflowStepResult } from '@/lib/workflowInterpreter';
import { buildTestCases } from '@/lib/testVectors';
import { DEFAULT_CURRENT_TIME, DEFAULT_START, DEFAULT_DURATION, type AvailabilityResult, type ReasonCode } from '@/lib/availability';
import { ResultBanner } from '@/components/Timeline';

function minutesToLabel(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

const numberInputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

const stepIcon: Record<WorkflowStepResult['kind'], string> = {
  guard: 'Field guard',
  compare: 'Comparison',
  range: 'Range check',
  flag: 'Flag check',
  overlap: 'Overlap check',
  success: 'Success',
};

export default function LowCodeLab() {
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(String(DEFAULT_CURRENT_TIME));
  const [startStr, setStartStr] = useState<string>(String(DEFAULT_START));
  const [durationStr, setDurationStr] = useState<string>(String(DEFAULT_DURATION));
  const [blocked, setBlocked] = useState(false);

  const baseRoom = SAMPLE_ROOMS[0];

  const currentTime = Number(currentTimeStr);
  const start = Number(startStr);
  const duration = Number(durationStr);
  const inputsFilled =
    currentTimeStr.trim() !== '' &&
    startStr.trim() !== '' &&
    durationStr.trim() !== '' &&
    [currentTime, start, duration].every((n) => Number.isFinite(n));

  const outcome = useMemo(() => {
    if (!inputsFilled) return null;
    return runWorkflow({ currentTime, start, duration, blocked });
  }, [currentTime, start, duration, blocked, inputsFilled]);

  // Live T1-T8, using the SHARED vectors — same cases the code-based runner uses.
  const testRows = useMemo(() => {
    const cases = buildTestCases(baseRoom);
    const rows: { id: string; description: string; pass: boolean; detail: string }[] = cases.map((tc) => {
      const o = runWorkflow({ currentTime: tc.currentTime, start: tc.start, duration: tc.duration, blocked: tc.room.blocked });
      const pass = o.result.reasonCode === tc.expectCode && o.result.available === (tc.expectCode === 'OK');
      return { id: tc.id, description: tc.description, pass, detail: `reasonCode=${o.result.reasonCode}, message="${o.result.message}"` };
    });
    const before = JSON.stringify(baseRoom);
    runWorkflow({ currentTime: 570, start: 660, duration: 60, blocked: false });
    const after = JSON.stringify(baseRoom);
    rows.push({
      id: 'T8',
      description: 'Booking data unchanged (deep check)',
      pass: before === after,
      detail: before === after ? 'room data untouched by workflow run' : 'room data changed!',
    });
    return rows;
  }, [baseRoom]);

  const allPass = testRows.every((r) => r.pass);

  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-5 sm:p-6">
      {/* Simulation label */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5" />
          Simulated low-code workflow (built in Bolt)
        </span>
        <span className="text-xs text-amber-700">
          Declarative JSON + generic interpreter mimicking a visual builder — not actual Appsmith/Power Apps output.
        </span>
      </div>

      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Workflow className="h-5 w-5 text-amber-600" />
        {workflow.label}
      </h2>

      {/* Form driven by workflow.fields */}
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => e.preventDefault()}
        aria-label={`${workflow.label} form`}
      >
        {workflow.fields.map((f) => {
          if (f.type === 'boolean') {
            return (
              <div key={f.name} className="sm:col-span-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={blocked}
                    onChange={(e) => setBlocked(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  {f.label}
                </label>
              </div>
            );
          }
          const value = f.name === 'currentTime' ? currentTimeStr : f.name === 'start' ? startStr : durationStr;
          const setter = f.name === 'currentTime' ? setCurrentTimeStr : f.name === 'start' ? setStartStr : setDurationStr;
          return (
            <div key={f.name}>
              <label htmlFor={`wf-${f.name}`} className="mb-1 block text-sm font-medium text-slate-700">
                {f.label}
              </label>
              <input
                id={`wf-${f.name}`}
                type="number"
                min={f.min}
                max={f.max}
                required={f.required}
                value={value}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                className={numberInputClass}
              />
              {f.name === 'start' && Number.isFinite(start) && startStr.trim() !== '' && (
                <p className="mt-1 text-xs text-slate-400">{minutesToLabel(start)} HH:MM</p>
              )}
              {f.name === 'currentTime' && Number.isFinite(currentTime) && currentTimeStr.trim() !== '' && (
                <p className="mt-1 text-xs text-slate-400">{minutesToLabel(currentTime)} HH:MM</p>
              )}
            </div>
          );
        })}
      </form>

      {/* Decision */}
      {outcome && <div className="mt-4"><ResultBanner result={outcome.result as AvailabilityResult} /></div>}

      {/* Read-only workflow cards */}
      <div className="mt-5">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <ClipboardList className="h-4 w-4 text-slate-400" />
          Workflow steps (read-only, rendered from JSON)
        </h3>
        <ol className="grid gap-2 sm:grid-cols-2">
          {workflow.steps.map((step, i) => {
            const live = outcome?.steps[i];
            const status = live?.status ?? 'skipped';
            const color =
              status === 'passed' ? 'border-emerald-200 bg-emerald-50' :
              status === 'failed' ? 'border-rose-200 bg-rose-50' :
              'border-slate-200 bg-slate-50 opacity-60';
            return (
              <li key={step.name} className={`rounded-xl border p-3 text-sm ${color}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">
                    {i + 1}. {step.name}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    status === 'passed' ? 'bg-emerald-100 text-emerald-700' :
                    status === 'failed' ? 'bg-rose-100 text-rose-700' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{step.description}</p>
                <p className="mt-1 font-mono text-[10px] text-slate-400">{stepIcon[step.kind]}</p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Live T1-T8 results for this implementation */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-700">
          Live test results (T1–T8, shared vectors)
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${allPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {testRows.filter((r) => r.pass).length}/{testRows.length} passing
          </span>
        </h3>
        <ul className="mt-3 space-y-1">
          {testRows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded px-2 py-1 text-sm odd:bg-slate-50">
              <span className={`font-mono text-xs font-semibold ${r.pass ? 'text-emerald-700' : 'text-rose-700'}`}>
                {r.pass ? 'PASS' : 'FAIL'}
              </span>
              <span className="font-mono text-xs text-slate-500">{r.id}</span>
              <span className="text-slate-700">{r.description}</span>
              <span className="w-full font-mono text-xs text-slate-400 sm:w-auto sm:ml-auto">{r.detail}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-400">
          Shares the same test vectors as the code-based implementation, executed through the declarative interpreter.
        </p>
      </div>
    </div>
  );
}

export type { ReasonCode };
