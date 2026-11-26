import workflowConfig from './workflow.json';
import type { AvailabilityResult, ReasonCode } from './availability';

/**
 * Generic declarative interpreter for the simulated low-code workflow.
 *
 * This mimics how a visual builder (Appsmith / Power Apps style) runs a
 * screen flow: a JSON document describes the fields and the ordered rule
 * steps, and this engine executes them generically. It is a SIMULATION
 * built in Bolt — it is not evidence of real low-code platform use.
 *
 * Deliberately no `eval`, no `new Function`, no rule code hidden in strings:
 * each step kind is a small, explicit switch branch.
 */

export interface WorkflowField {
  name: string;
  label: string;
  type: 'number' | 'boolean';
  min?: number;
  max?: number;
  required: boolean;
}

export interface WorkflowStep {
  name: string;
  description: string;
  kind: 'guard' | 'compare' | 'range' | 'flag' | 'overlap' | 'success';
  config: Record<string, unknown>;
}

export interface WorkflowConfig {
  id: string;
  label: string;
  fields: WorkflowField[];
  steps: WorkflowStep[];
}

export const workflow: WorkflowConfig = workflowConfig as unknown as WorkflowConfig;

/** Shape both implementations accept — the shared input contract. */
export interface WorkflowInput {
  currentTime: number;
  start: number;
  duration: number;
  blocked: boolean;
}

export interface WorkflowStepResult {
  name: string;
  description: string;
  kind: WorkflowStep['kind'];
  status: 'passed' | 'failed' | 'skipped';
  detail: string;
}

export interface WorkflowOutcome {
  result: AvailabilityResult;
  steps: WorkflowStepResult[];
}

function code(cfg: Record<string, unknown>): ReasonCode {
  return cfg.failureCode as ReasonCode;
}

function message(cfg: Record<string, unknown>): string {
  return cfg.failureMessage as string;
}

/** Generic step executor. Returns a failure result, or null if the step passed. */
function evaluateStep(
  step: WorkflowStep,
  input: WorkflowInput
): { reasonCode: ReasonCode; message: string } | null {
  const cfg = step.config;

  switch (step.kind) {
    case 'guard': {
      const values = [input.currentTime, input.start, input.duration];
      const ok = values.every(
        (v) => Number.isFinite(v) && Number.isInteger(v) && v >= (cfg.min as number) && v <= (cfg.max as number)
      );
      return ok ? null : { reasonCode: code(cfg), message: message(cfg) };
    }

    case 'compare': {
      const left = input[cfg.left as keyof WorkflowInput] as number;
      const right = input[cfg.right as keyof WorkflowInput] as number;
      const op = cfg.operator;
      const failed =
        op === 'gte' ? left >= right :
        op === 'lte' ? left <= right :
        op === 'gt' ? left > right :
        op === 'lt' ? left < right : false;
      return failed ? { reasonCode: code(cfg), message: message(cfg) } : null;
    }

    case 'range': {
      const v = input[cfg.field as keyof WorkflowInput] as number;
      const ok = v >= (cfg.min as number) && v <= (cfg.max as number);
      return ok ? null : { reasonCode: code(cfg), message: message(cfg) };
    }

    case 'flag': {
      const v = input[cfg.field as keyof WorkflowInput] as boolean;
      return v ? { reasonCode: code(cfg), message: message(cfg) } : null;
    }

    case 'overlap': {
      const bs = cfg.bookingStart as number;
      const be = cfg.bookingEnd as number;
      const end = input.start + input.duration;
      const overlaps = input.start < be && end > bs;
      return overlaps ? { reasonCode: code(cfg), message: message(cfg) } : null;
    }

    case 'success':
      return null;

    default:
      return { reasonCode: 'BAD_INPUT', message: `Unknown step kind: ${String(step.kind)}` };
  }
}

/**
 * Run the declarative workflow. Read-only: never mutates the input or any
 * room data — it receives plain values, not the Room object itself.
 */
export function runWorkflow(input: WorkflowInput): WorkflowOutcome {
  const steps: WorkflowStepResult[] = [];
  let failure: { reasonCode: ReasonCode; message: string } | null = null;

  for (const step of workflow.steps) {
    if (failure) {
      steps.push({ name: step.name, description: step.description, kind: step.kind, status: 'skipped', detail: 'Skipped — an earlier step already failed.' });
      continue;
    }
    const res = evaluateStep(step, input);
    if (res) {
      failure = res;
      steps.push({ name: step.name, description: step.description, kind: step.kind, status: 'failed', detail: res.message });
    } else {
      const detail =
        step.kind === 'overlap'
          ? `start=${input.start}, end=${input.start + input.duration} vs booking ${step.config.bookingStart}–${step.config.bookingEnd}`
          : step.kind === 'success'
            ? (step.config.message as string)
            : 'Condition met.';
      steps.push({ name: step.name, description: step.description, kind: step.kind, status: 'passed', detail });
    }
  }

  const result: AvailabilityResult = failure
    ? { available: false, reasonCode: failure.reasonCode, message: failure.message }
    : { available: true, reasonCode: 'OK', message: workflow.steps[workflow.steps.length - 1].config.message as string };

  return { result, steps };
}
