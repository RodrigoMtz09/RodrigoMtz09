import Dexie, { type Table } from "dexie";
import type { SrsState } from "./sm2";

// All progress is stored locally in IndexedDB via Dexie. No backend, no auth.

export interface ExamAttempt {
  id?: number;
  startedAt: number;
  finishedAt: number;
  mode: "exam" | "study";
  totalQuestions: number;
  totalCorrect: number;
  scaledScore: number;
  passed: boolean;
  /** Per-question answer log for review. */
  answers: {
    questionId: string;
    domain: string;
    subObjective: string;
    tags: string[];
    selected: string[];
    correct: boolean;
    timeMs: number;
  }[];
}

export interface SrsRecord extends SrsState {
  // Key is the question id (or "tag:<tag>" for tag-level scheduling).
  key: string;
  kind: "question" | "tag";
  lapses: number;
}

/** Rolled-up accuracy per sub-objective for the weak-spot dashboard. */
export interface SubObjectiveStat {
  id?: number;
  subObjective: string;
  domain: string;
  seen: number;
  correct: number;
  updatedAt: number;
}

class TrainerDb extends Dexie {
  attempts!: Table<ExamAttempt, number>;
  srs!: Table<SrsRecord, string>;
  subObjectiveStats!: Table<SubObjectiveStat, number>;

  constructor() {
    super("pl300-trainer");
    this.version(1).stores({
      attempts: "++id, startedAt, mode, passed",
      srs: "key, kind, due",
      subObjectiveStats: "++id, &[subObjective+domain], domain, updatedAt",
    });
  }
}

export const db = new TrainerDb();

export async function recordSubObjectiveResults(
  results: { subObjective: string; domain: string; correct: boolean }[],
  now: number,
): Promise<void> {
  await db.transaction("rw", db.subObjectiveStats, async () => {
    for (const r of results) {
      const existing = await db.subObjectiveStats
        .where("[subObjective+domain]")
        .equals([r.subObjective, r.domain])
        .first();
      if (existing) {
        existing.seen += 1;
        existing.correct += r.correct ? 1 : 0;
        existing.updatedAt = now;
        await db.subObjectiveStats.put(existing);
      } else {
        await db.subObjectiveStats.add({
          subObjective: r.subObjective,
          domain: r.domain,
          seen: 1,
          correct: r.correct ? 1 : 0,
          updatedAt: now,
        });
      }
    }
  });
}
