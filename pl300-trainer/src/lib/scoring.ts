import type { Domain, Question } from "@/types/question";
import { DOMAIN_ORDER, DOMAIN_WEIGHTS } from "@/types/question";
import { arraysEqualAsSets } from "./utils";

export interface AnswerRecord {
  questionId: string;
  selected: string[];
  correct: boolean;
  timeMs: number;
  flagged: boolean;
}

export interface DomainBreakdown {
  domain: Domain;
  total: number;
  correct: number;
  accuracy: number; // 0..1
}

export interface TagBreakdown {
  tag: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface ScoreReport {
  totalQuestions: number;
  totalCorrect: number;
  rawAccuracy: number; // 0..1
  scaledScore: number; // 100..1000 estimate
  passed: boolean;
  byDomain: DomainBreakdown[];
  byTag: TagBreakdown[];
  totalTimeMs: number;
  avgTimeMs: number;
}

export const PASSING_SCALED = 700;

export function isCorrect(q: Question, selected: string[]): boolean {
  return arraysEqualAsSets(q.correct, selected);
}

/**
 * Estimate a PL-300-style scaled score (100..1000).
 *
 * Microsoft does not publish the exact scaling curve, and the passing score
 * (700) is NOT a raw 70%. We approximate: map raw accuracy through a mild
 * curve so that ~70% raw lands near the 700 passing mark, which matches
 * candidates' widely reported experience. This is clearly an ESTIMATE and is
 * labelled as such in the UI — it is not an official score.
 */
export function estimateScaledScore(rawAccuracy: number): number {
  const clamped = Math.max(0, Math.min(1, rawAccuracy));
  // Anchor points: 0% -> 100, 70% -> 700, 100% -> 1000. Piecewise-linear.
  let scaled: number;
  if (clamped <= 0.7) {
    scaled = 100 + (clamped / 0.7) * (700 - 100);
  } else {
    scaled = 700 + ((clamped - 0.7) / 0.3) * (1000 - 700);
  }
  return Math.round(scaled);
}

export function buildScoreReport(
  questions: Question[],
  answers: Record<string, AnswerRecord>,
): ScoreReport {
  const totalQuestions = questions.length;
  let totalCorrect = 0;
  let totalTimeMs = 0;

  const domainAgg = new Map<Domain, { total: number; correct: number }>();
  const tagAgg = new Map<string, { total: number; correct: number }>();

  for (const q of questions) {
    const a = answers[q.id];
    const correct = a?.correct ?? false;
    if (correct) totalCorrect++;
    totalTimeMs += a?.timeMs ?? 0;

    const d = domainAgg.get(q.domain) ?? { total: 0, correct: 0 };
    d.total++;
    if (correct) d.correct++;
    domainAgg.set(q.domain, d);

    for (const tag of q.tags) {
      const t = tagAgg.get(tag) ?? { total: 0, correct: 0 };
      t.total++;
      if (correct) t.correct++;
      tagAgg.set(tag, t);
    }
  }

  const rawAccuracy = totalQuestions === 0 ? 0 : totalCorrect / totalQuestions;
  const scaledScore = estimateScaledScore(rawAccuracy);

  const byDomain: DomainBreakdown[] = DOMAIN_ORDER.filter((d) =>
    domainAgg.has(d),
  ).map((domain) => {
    const agg = domainAgg.get(domain)!;
    return {
      domain,
      total: agg.total,
      correct: agg.correct,
      accuracy: agg.total ? agg.correct / agg.total : 0,
    };
  });

  const byTag: TagBreakdown[] = [...tagAgg.entries()]
    .map(([tag, agg]) => ({
      tag,
      total: agg.total,
      correct: agg.correct,
      accuracy: agg.total ? agg.correct / agg.total : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);

  return {
    totalQuestions,
    totalCorrect,
    rawAccuracy,
    scaledScore,
    passed: scaledScore >= PASSING_SCALED,
    byDomain,
    byTag,
    totalTimeMs,
    avgTimeMs: totalQuestions ? totalTimeMs / totalQuestions : 0,
  };
}

export { DOMAIN_WEIGHTS };
