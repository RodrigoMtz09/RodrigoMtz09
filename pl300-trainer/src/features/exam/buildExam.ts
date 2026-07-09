import type { Question, Domain } from "@/types/question";
import { DOMAIN_ORDER, DOMAIN_WEIGHTS } from "@/types/question";
import { ALL_QUESTIONS, CASE_STUDIES } from "@/lib/content";
import { shuffle } from "@/lib/utils";

export interface ExamConfig {
  size: number; // total question count target
  includeCaseStudy: boolean;
  timeLimitMin: number | null;
  seed: number;
}

/** Midpoint of each domain's official weight range, normalized to sum to 1. */
function targetWeights(): Record<Domain, number> {
  const mids = DOMAIN_ORDER.map((d) => {
    const [lo, hi] = DOMAIN_WEIGHTS[d];
    return (lo + hi) / 2;
  });
  const sum = mids.reduce((a, b) => a + b, 0);
  const out = {} as Record<Domain, number>;
  DOMAIN_ORDER.forEach((d, i) => (out[d] = mids[i] / sum));
  return out;
}

/**
 * Assemble an exam form. Case-study items are kept together as a contiguous
 * section at the end (mirroring the real exam UX) and count toward the domain mix.
 */
export function buildExam(config: ExamConfig): {
  questions: Question[];
  caseStudyId: string | null;
} {
  const weights = targetWeights();
  const standalone = ALL_QUESTIONS.filter((q) => !q.caseStudyId);

  let caseStudyQuestions: Question[] = [];
  let caseStudyId: string | null = null;
  if (config.includeCaseStudy && CASE_STUDIES.length > 0) {
    const cs = CASE_STUDIES[0];
    caseStudyId = cs.id;
    caseStudyQuestions = cs.questions.map((q) => ({
      ...q,
      caseStudyId: cs.id,
    }));
  }

  const remaining = Math.max(0, config.size - caseStudyQuestions.length);

  // Count case-study items already contributing to each domain.
  const csByDomain = countByDomain(caseStudyQuestions);

  const picked: Question[] = [];
  const byDomain: Record<Domain, Question[]> = {
    prepare: [],
    model: [],
    visualize: [],
    manage: [],
  };
  for (const q of shuffle(standalone, config.seed)) byDomain[q.domain].push(q);

  // Desired count per domain across the WHOLE form, then subtract case-study items.
  for (const d of DOMAIN_ORDER) {
    const wholeTarget = Math.round(config.size * weights[d]);
    const need = Math.max(0, wholeTarget - (csByDomain[d] ?? 0));
    picked.push(...byDomain[d].slice(0, need));
  }

  // Fix rounding drift so we hit `remaining` exactly.
  let pool = shuffle(
    standalone.filter((q) => !picked.includes(q)),
    config.seed + 1,
  );
  while (picked.length < remaining && pool.length > 0) picked.push(pool.pop()!);
  while (picked.length > remaining) picked.pop();

  const shuffledStandalone = shuffle(picked, config.seed + 2);
  return {
    questions: [...shuffledStandalone, ...caseStudyQuestions],
    caseStudyId,
  };
}

function countByDomain(qs: Question[]): Record<Domain, number> {
  const out: Record<Domain, number> = {
    prepare: 0,
    model: 0,
    visualize: 0,
    manage: 0,
  };
  for (const q of qs) out[q.domain]++;
  return out;
}
