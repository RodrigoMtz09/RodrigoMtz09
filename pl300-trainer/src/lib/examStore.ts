import { create } from "zustand";
import type { Question } from "@/types/question";
import { isCorrect } from "./scoring";

export type SessionMode = "exam" | "study";

export interface SessionAnswer {
  selected: string[];
  timeMs: number;
  flagged: boolean;
  // Revealed feedback (study mode only) — once revealed, the answer is locked.
  revealed: boolean;
}

interface SessionState {
  mode: SessionMode | null;
  questions: Question[];
  /** index in `questions` grouped so case-study items are contiguous. */
  order: number[];
  cursor: number; // pointer into `order`
  answers: Record<string, SessionAnswer>;
  startedAt: number;
  enteredAt: number; // when the current question was shown (for timing)
  /** Case-study section ids that have been submitted (no back-nav allowed). */
  lockedSections: Set<string>;
  timeLimitMs: number | null;
  finished: boolean;

  start: (opts: {
    mode: SessionMode;
    questions: Question[];
    timeLimitMs?: number | null;
    now: number;
  }) => void;
  select: (questionId: string, optionId: string, multi: boolean) => void;
  toggleFlag: (questionId: string) => void;
  reveal: (questionId: string) => void;
  goTo: (cursor: number, now: number) => void;
  next: (now: number) => void;
  prev: (now: number) => void;
  lockSection: (sectionId: string) => void;
  commitTime: (now: number) => void;
  finish: (now: number) => void;
  reset: () => void;
}

function emptyAnswer(): SessionAnswer {
  return { selected: [], timeMs: 0, flagged: false, revealed: false };
}

export const useSession = create<SessionState>((set, get) => ({
  mode: null,
  questions: [],
  order: [],
  cursor: 0,
  answers: {},
  startedAt: 0,
  enteredAt: 0,
  lockedSections: new Set(),
  timeLimitMs: null,
  finished: false,

  start: ({ mode, questions, timeLimitMs = null, now }) => {
    const answers: Record<string, SessionAnswer> = {};
    for (const q of questions) answers[q.id] = emptyAnswer();
    set({
      mode,
      questions,
      order: questions.map((_, i) => i),
      cursor: 0,
      answers,
      startedAt: now,
      enteredAt: now,
      lockedSections: new Set(),
      timeLimitMs,
      finished: false,
    });
  },

  select: (questionId, optionId, multi) => {
    set((s) => {
      const prev = s.answers[questionId] ?? emptyAnswer();
      if (prev.revealed) return s; // locked after feedback in study mode
      let selected: string[];
      if (multi) {
        selected = prev.selected.includes(optionId)
          ? prev.selected.filter((x) => x !== optionId)
          : [...prev.selected, optionId];
      } else {
        selected = [optionId];
      }
      return { answers: { ...s.answers, [questionId]: { ...prev, selected } } };
    });
  },

  toggleFlag: (questionId) => {
    set((s) => {
      const prev = s.answers[questionId] ?? emptyAnswer();
      return {
        answers: {
          ...s.answers,
          [questionId]: { ...prev, flagged: !prev.flagged },
        },
      };
    });
  },

  reveal: (questionId) => {
    set((s) => {
      const prev = s.answers[questionId] ?? emptyAnswer();
      return {
        answers: { ...s.answers, [questionId]: { ...prev, revealed: true } },
      };
    });
  },

  commitTime: (now) => {
    set((s) => {
      const q = s.questions[s.order[s.cursor]];
      if (!q) return s;
      const prev = s.answers[q.id] ?? emptyAnswer();
      const delta = Math.max(0, now - s.enteredAt);
      return {
        enteredAt: now,
        answers: {
          ...s.answers,
          [q.id]: { ...prev, timeMs: prev.timeMs + delta },
        },
      };
    });
  },

  goTo: (cursor, now) => {
    get().commitTime(now);
    set((s) => ({ cursor: Math.max(0, Math.min(s.order.length - 1, cursor)) }));
  },

  next: (now) => {
    const s = get();
    s.goTo(s.cursor + 1, now);
  },

  prev: (now) => {
    const s = get();
    s.goTo(s.cursor - 1, now);
  },

  lockSection: (sectionId) => {
    set((s) => {
      const next = new Set(s.lockedSections);
      next.add(sectionId);
      return { lockedSections: next };
    });
  },

  finish: (now) => {
    get().commitTime(now);
    set({ finished: true });
  },

  reset: () =>
    set({
      mode: null,
      questions: [],
      order: [],
      cursor: 0,
      answers: {},
      startedAt: 0,
      enteredAt: 0,
      lockedSections: new Set(),
      timeLimitMs: null,
      finished: false,
    }),
}));

export function gradeAnswer(q: Question, selected: string[]): boolean {
  return isCorrect(q, selected);
}
