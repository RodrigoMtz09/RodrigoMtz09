import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Validates the authored content in /content against the Question schema and
// the approved domain distribution. This is the guardrail described in
// CONTRIBUTING.md — a new question that breaks the shape fails CI here.

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, "..", "..", "content");
const questionsDir = join(contentDir, "questions");

const DOMAINS = ["prepare", "model", "visualize", "manage"];
const TYPES = ["single", "multi", "dragdrop", "dropdown", "hotspot", "caseStudy"];
const SINGLE_ANSWER_TYPES = new Set(["single", "dropdown", "hotspot"]);

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function collectQuestions(): any[] {
  const out: any[] = [];
  for (const file of readdirSync(questionsDir)) {
    if (!file.endsWith(".json")) continue;
    const data = readJson(join(questionsDir, file));
    if (Array.isArray(data.questions)) {
      out.push(...data.questions.map((q: any) => ({ ...q, __file: file })));
    }
    if (Array.isArray(data.caseStudies)) {
      for (const cs of data.caseStudies) {
        for (const q of cs.questions) {
          out.push({ ...q, __file: file, caseStudyId: q.caseStudyId ?? cs.id });
        }
      }
    }
  }
  return out;
}

const questions = collectQuestions();

function validateQuestion(q: any): string[] {
  const errs: string[] = [];
  const id = q.id ?? "<no id>";
  const req = (cond: boolean, msg: string) => {
    if (!cond) errs.push(`${id}: ${msg}`);
  };

  req(typeof q.id === "string" && q.id.length > 0, "missing id");
  req(DOMAINS.includes(q.domain), `invalid domain "${q.domain}"`);
  req(typeof q.objective === "string" && q.objective.length > 0, "missing objective");
  req(
    typeof q.subObjective === "string" && q.subObjective.length > 0,
    "missing subObjective",
  );
  req(TYPES.includes(q.type), `invalid type "${q.type}"`);
  req([1, 2, 3].includes(q.difficulty), `invalid difficulty ${q.difficulty}`);
  req(typeof q.stem === "string" && q.stem.length > 0, "missing stem");

  // options
  req(Array.isArray(q.options) && q.options.length >= 2, "needs >= 2 options");
  const optIds = new Set<string>();
  if (Array.isArray(q.options)) {
    for (const o of q.options) {
      req(typeof o.id === "string" && typeof o.text === "string", "bad option shape");
      req(!optIds.has(o.id), `duplicate option id "${o.id}"`);
      optIds.add(o.id);
    }
  }

  // correct
  req(Array.isArray(q.correct) && q.correct.length >= 1, "needs >=1 correct id");
  if (Array.isArray(q.correct)) {
    for (const c of q.correct) req(optIds.has(c), `correct id "${c}" not in options`);
    if (SINGLE_ANSWER_TYPES.has(q.type)) {
      req(q.correct.length === 1, `${q.type} must have exactly 1 correct answer`);
    }
    if (q.type === "multi") {
      req(q.correct.length >= 2, "multi should have >=2 correct answers");
    }
  }

  // explanation
  req(
    q.explanation && typeof q.explanation.why === "string" && q.explanation.why.length > 0,
    "missing explanation.why",
  );
  const whyNot = q.explanation?.whyNot ?? {};
  const wrong = [...optIds].filter((oid) => !(q.correct ?? []).includes(oid));
  for (const w of wrong) {
    req(
      typeof whyNot[w] === "string" && whyNot[w].length > 0,
      `explanation.whyNot missing entry for wrong option "${w}"`,
    );
  }

  // source
  req(
    typeof q.sourceUrl === "string" &&
      /^https:\/\/learn\.microsoft\.com\//.test(q.sourceUrl),
    `sourceUrl must be an https learn.microsoft.com URL (got "${q.sourceUrl}")`,
  );

  // tags
  req(Array.isArray(q.tags) && q.tags.length >= 1, "needs >=1 tag");

  return errs;
}

describe("question content", () => {
  it("loads questions from /content", () => {
    expect(questions.length).toBeGreaterThan(0);
  });

  it("every question conforms to the schema", () => {
    const allErrors = questions.flatMap(validateQuestion);
    if (allErrors.length) {
      throw new Error(`\n${allErrors.join("\n")}`);
    }
    expect(allErrors).toHaveLength(0);
  });

  it("has globally unique ids", () => {
    const seen = new Map<string, number>();
    for (const q of questions) seen.set(q.id, (seen.get(q.id) ?? 0) + 1);
    const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
    expect(dupes).toEqual([]);
  });

  it("totals 120 questions", () => {
    expect(questions.length).toBe(120);
  });

  it("matches the approved domain distribution (33/33/33/21)", () => {
    const counts: Record<string, number> = {};
    for (const q of questions) counts[q.domain] = (counts[q.domain] ?? 0) + 1;
    expect(counts).toEqual({
      prepare: 33,
      model: 33,
      visualize: 33,
      manage: 21,
    });
  });

  it("keeps every domain inside its official weight range", () => {
    const ranges: Record<string, [number, number]> = {
      prepare: [25, 30],
      model: [25, 30],
      visualize: [25, 30],
      manage: [15, 20],
    };
    for (const d of DOMAINS) {
      const n = questions.filter((q) => q.domain === d).length;
      const pct = (n / questions.length) * 100;
      const [lo, hi] = ranges[d];
      expect(pct, `${d} at ${pct.toFixed(1)}%`).toBeGreaterThanOrEqual(lo);
      expect(pct, `${d} at ${pct.toFixed(1)}%`).toBeLessThanOrEqual(hi);
    }
  });

  it("includes at least one case study with 4-5 linked items", () => {
    const csFile = readJson(join(questionsDir, "casestudy.json"));
    expect(Array.isArray(csFile.caseStudies)).toBe(true);
    expect(csFile.caseStudies.length).toBeGreaterThanOrEqual(1);
    const first = csFile.caseStudies[0];
    expect(typeof first.scenario).toBe("string");
    expect(first.questions.length).toBeGreaterThanOrEqual(4);
    expect(first.questions.length).toBeLessThanOrEqual(5);
  });
});
