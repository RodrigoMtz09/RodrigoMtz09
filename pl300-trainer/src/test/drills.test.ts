import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Validates the Phase 3 drill bank (flashcards + predict-output + context
// drills) shape and citations. Companion to schema.test.ts.

const here = dirname(fileURLToPath(import.meta.url));
const drillsPath = join(here, "..", "..", "content", "drills", "dax-drills.json");
const drills = JSON.parse(readFileSync(drillsPath, "utf-8"));

const LEARN = /^https:\/\/learn\.microsoft\.com\//;

describe("drill content", () => {
  it("has flashcards with a group, front/back, and a Learn source", () => {
    expect(Array.isArray(drills.flashcards)).toBe(true);
    expect(drills.flashcards.length).toBeGreaterThanOrEqual(20);
    for (const c of drills.flashcards) {
      expect(typeof c.front, `flashcard ${c.id} front`).toBe("string");
      expect(typeof c.back, `flashcard ${c.id} back`).toBe("string");
      expect(typeof c.group, `flashcard ${c.id} group`).toBe("string");
      expect(c.sourceUrl, `flashcard ${c.id} source`).toMatch(LEARN);
    }
  });

  it("has solvable predict-output and context drills", () => {
    for (const key of ["predictOutput", "contextDrills"] as const) {
      expect(Array.isArray(drills[key]), key).toBe(true);
      expect(drills[key].length).toBeGreaterThanOrEqual(1);
      for (const d of drills[key]) {
        expect(typeof d.model, `${d.id} model`).toBe("string");
        expect(typeof d.measure, `${d.id} measure`).toBe("string");
        expect(Array.isArray(d.options) && d.options.length >= 2, `${d.id} options`).toBe(
          true,
        );
        const ids = new Set(d.options.map((o: { id: string }) => o.id));
        expect(d.correct.length, `${d.id} correct`).toBeGreaterThanOrEqual(1);
        for (const c of d.correct) {
          expect(ids.has(c), `${d.id} correct id "${c}" in options`).toBe(true);
        }
        expect(typeof d.explanation, `${d.id} explanation`).toBe("string");
        expect(d.sourceUrl, `${d.id} source`).toMatch(LEARN);
      }
    }
  });
});
