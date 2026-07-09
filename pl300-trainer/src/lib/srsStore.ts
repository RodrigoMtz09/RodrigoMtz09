import { db, type SrsRecord } from "./db";
import { initialSrs, scheduleSm2, qualityFromAnswer } from "./sm2";

// SM-2 scheduling persisted in IndexedDB. We schedule at two granularities:
//   - per question (key = questionId)
//   - per tag      (key = "tag:<tag>")
// so the "due review" queue can surface both weak items and weak topics.

export interface ResultSignal {
  questionId: string;
  tags: string[];
  correct: boolean;
  timeMs: number;
}

export async function upsertSrsFromResults(
  results: ResultSignal[],
  now: number,
): Promise<void> {
  await db.transaction("rw", db.srs, async () => {
    for (const r of results) {
      const quality = qualityFromAnswer({
        correct: r.correct,
        timeMs: r.timeMs,
      });
      await applyOne(`${r.questionId}`, "question", quality, r.correct, now);
      for (const tag of r.tags) {
        await applyOne(`tag:${tag}`, "tag", quality, r.correct, now);
      }
    }
  });
}

async function applyOne(
  key: string,
  kind: SrsRecord["kind"],
  quality: number,
  correct: boolean,
  now: number,
): Promise<void> {
  const existing = await db.srs.get(key);
  const base = existing ?? {
    key,
    kind,
    lapses: 0,
    ...initialSrs(now),
  };
  const next = scheduleSm2(base, quality, now);
  await db.srs.put({
    ...base,
    ...next,
    key,
    kind,
    lapses: base.lapses + (correct ? 0 : 1),
  });
}

export async function dueQuestionIds(now: number): Promise<string[]> {
  const all = await db.srs.where("kind").equals("question").toArray();
  return all
    .filter((r) => r.due <= now)
    .sort((a, b) => a.due - b.due)
    .map((r) => r.key);
}

export async function weakTags(now: number, limit = 8): Promise<
  { tag: string; due: boolean; lapses: number; easiness: number }[]
> {
  const all = await db.srs.where("kind").equals("tag").toArray();
  return all
    .sort((a, b) => b.lapses - a.lapses || a.easiness - b.easiness)
    .slice(0, limit)
    .map((r) => ({
      tag: r.key.replace(/^tag:/, ""),
      due: r.due <= now,
      lapses: r.lapses,
      easiness: r.easiness,
    }));
}

export async function srsSummary(now: number): Promise<{
  tracked: number;
  due: number;
}> {
  const all = await db.srs.where("kind").equals("question").toArray();
  return {
    tracked: all.length,
    due: all.filter((r) => r.due <= now).length,
  };
}
