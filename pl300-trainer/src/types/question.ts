// Canonical content types for the PL-300 trainer.
// Questions live as versioned JSON in /content — never hardcode them in components.

export type Domain = "prepare" | "model" | "visualize" | "manage";

export type QuestionType =
  | "single"
  | "multi"
  | "dragdrop"
  | "dropdown"
  | "hotspot"
  | "caseStudy";

export type Difficulty = 1 | 2 | 3;

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionExplanation {
  why: string; // why the right answer is right
  whyNot: Record<string, string>; // why EACH distractor is wrong (keyed by option id)
}

export interface Question {
  id: string; // "prep-pq-0142"
  domain: Domain;
  objective: string; // e.g. "Transform and load the data"
  subObjective: string; // e.g. "Pivot, unpivot, and transpose data"
  type: QuestionType;
  difficulty: Difficulty;
  stem: string; // markdown, may include DAX/M code blocks
  exhibit?: string; // model diagram, table preview, or M script
  options: QuestionOption[];
  correct: string[]; // one or more option ids
  explanation: QuestionExplanation;
  sourceUrl: string; // Microsoft Learn citation
  tags: string[];
  /** Present only for questions that belong to a case study. */
  caseStudyId?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  scenario: string; // shared markdown scenario
  questions: Question[];
}

// ---- Drill content (Phase 3) ----

export type DaxGroup =
  | "CALCULATE"
  | "filter modifiers"
  | "time intelligence"
  | "iterators"
  | "semi-additive"
  | "calculation groups";

export interface Flashcard {
  id: string;
  group: DaxGroup;
  front: string;
  back: string; // may include a ```DAX``` example
  sourceUrl: string;
}

export interface PredictOutputDrill {
  id: string;
  model: string; // markdown table(s) describing a tiny model
  measure: string; // a DAX measure (```DAX``` fenced)
  question: string;
  options: QuestionOption[];
  correct: string[];
  explanation: string;
  sourceUrl: string;
}

export interface DrillBank {
  version: string;
  flashcards: Flashcard[];
  predictOutput: PredictOutputDrill[];
  contextDrills: PredictOutputDrill[];
}

export const DOMAIN_LABELS: Record<Domain, string> = {
  prepare: "Prepare the data",
  model: "Model the data",
  visualize: "Visualize and analyze the data",
  manage: "Manage and secure Power BI",
};

// Official weight ranges from the PL-300 skills outline (as of April 20, 2026).
export const DOMAIN_WEIGHTS: Record<Domain, [number, number]> = {
  prepare: [25, 30],
  model: [25, 30],
  visualize: [25, 30],
  manage: [15, 20],
};

export const DOMAIN_ORDER: Domain[] = ["prepare", "model", "visualize", "manage"];
