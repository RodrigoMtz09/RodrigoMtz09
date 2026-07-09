import type {
  Question,
  CaseStudy,
  DrillBank,
  Domain,
} from "@/types/question";

// Content is authored as versioned JSON in /content and loaded at build time.
// Question bank files: { version, domain, questions: Question[] }
// Case study file:      { version, caseStudies: CaseStudy[] }
// Drill bank file:      DrillBank

interface QuestionFile {
  version: string;
  domain?: Domain;
  questions: Question[];
}

interface CaseStudyFile {
  version: string;
  caseStudies: CaseStudy[];
}

const questionModules = import.meta.glob<QuestionFile>(
  "/content/questions/*.json",
  { eager: true, import: "default" },
);

const caseStudyModules = import.meta.glob<CaseStudyFile>(
  "/content/questions/casestudy.json",
  { eager: true, import: "default" },
);

const drillModules = import.meta.glob<DrillBank>(
  "/content/drills/*.json",
  { eager: true, import: "default" },
);

function loadCaseStudies(): CaseStudy[] {
  return Object.values(caseStudyModules).flatMap((f) => f.caseStudies ?? []);
}

function loadQuestions(): Question[] {
  const out: Question[] = [];
  for (const [path, file] of Object.entries(questionModules)) {
    // The case study file is loaded separately (its questions live under caseStudies).
    if (path.endsWith("casestudy.json")) continue;
    if (Array.isArray(file.questions)) out.push(...file.questions);
  }
  // Fold case study questions into the flat bank too (tagged with caseStudyId).
  for (const cs of loadCaseStudies()) {
    for (const q of cs.questions) {
      out.push({ ...q, caseStudyId: q.caseStudyId ?? cs.id });
    }
  }
  return out;
}

export const ALL_QUESTIONS: Question[] = loadQuestions();
export const CASE_STUDIES: CaseStudy[] = loadCaseStudies();

export const DRILLS: DrillBank =
  Object.values(drillModules)[0] ??
  ({ version: "0", flashcards: [], predictOutput: [], contextDrills: [] } as DrillBank);

export const CONTENT_VERSION: string =
  Object.values(questionModules)[0]?.version ?? "unknown";

export function questionsByDomain(domain: Domain): Question[] {
  return ALL_QUESTIONS.filter((q) => q.domain === domain);
}

export function objectivesForDomain(domain: Domain): string[] {
  const set = new Set<string>();
  for (const q of ALL_QUESTIONS) if (q.domain === domain) set.add(q.objective);
  return [...set];
}

export function subObjectivesForDomain(domain: Domain): string[] {
  const set = new Set<string>();
  for (const q of ALL_QUESTIONS) if (q.domain === domain) set.add(q.subObjective);
  return [...set];
}

export function questionById(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

export function allTags(): string[] {
  const set = new Set<string>();
  for (const q of ALL_QUESTIONS) for (const t of q.tags) set.add(t);
  return [...set].sort();
}
