// SM-2 spaced-repetition scheduling (SuperMemo 2).
// Quality grade q in 0..5. We drive review of missed questions and their tags.

export interface SrsState {
  repetitions: number; // number of consecutive correct recalls
  interval: number; // days until next review
  easiness: number; // easiness factor (>= 1.3)
  due: number; // epoch ms of next review
  lastReviewed: number; // epoch ms
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function initialSrs(now: number): SrsState {
  return {
    repetitions: 0,
    interval: 0,
    easiness: 2.5,
    due: now,
    lastReviewed: 0,
  };
}

/**
 * Apply one SM-2 review. `quality` is 0..5 (>=3 is a pass).
 * Returns the next scheduling state.
 */
export function scheduleSm2(
  prev: SrsState,
  quality: number,
  now: number,
): SrsState {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let { repetitions, interval, easiness } = prev;

  if (q < 3) {
    // Lapse: reset repetition count, review again soon (same day).
    repetitions = 0;
    interval = 0;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easiness);
  }

  // Update easiness factor.
  easiness = easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easiness < 1.3) easiness = 1.3;

  const due = interval === 0 ? now + 10 * 60 * 1000 : now + interval * DAY_MS;

  return {
    repetitions,
    interval,
    easiness: Math.round(easiness * 100) / 100,
    due,
    lastReviewed: now,
  };
}

/** Map a study answer to an SM-2 quality grade. */
export function qualityFromAnswer(opts: {
  correct: boolean;
  timeMs: number;
  hard?: boolean;
}): number {
  if (!opts.correct) return opts.timeMs > 60_000 ? 1 : 2;
  if (opts.hard) return 3;
  return opts.timeMs < 25_000 ? 5 : 4;
}
