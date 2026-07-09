# Contributing questions

The whole value of this trainer is the **quality and honesty of the question bank**. This guide is how you add your own questions without breaking the app or lowering the bar.

## Ground rules (non-negotiable)

1. **No braindumps.** Do not copy, paraphrase, or "remember" real exam questions from any site. That violates Microsoft's exam NDA and copyright. Author **original** items modeled on the [official skills outline](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300) and the style of Microsoft's free Practice Assessment.
2. **Every question cites a Microsoft Learn doc.** `sourceUrl` must be an `https://learn.microsoft.com/...` page that actually justifies the correct answer. If you can't cite it, don't ship it.
3. **Test a real decision.** No trivia. Scenario-first phrasing: *"You have a model with… You need to… What should you do?"* Distractors must be the **plausible wrong approach**, not nonsense.
4. **Review against the source** before committing. Open the `sourceUrl` and confirm the behavior is current — Power BI ships monthly.

## Where content lives

```
content/
  questions/
    prepare.json      # domain: "prepare"
    model.json        # domain: "model"
    visualize.json    # domain: "visualize"
    manage.json       # domain: "manage"
    casestudy.json    # linked multi-question case studies
  drills/
    dax-drills.json   # flashcards + predict-output + context drills
```

Each domain file is:

```jsonc
{
  "version": "2026.04.20",   // outline version the content targets
  "domain": "prepare",
  "questions": [ /* Question[] */ ]
}
```

## Question schema

```ts
type Question = {
  id: string;                     // unique, prefixed: "prep-…", "model-…", "viz-…", "mng-…"
  domain: "prepare" | "model" | "visualize" | "manage";
  objective: string;              // exact objective string from the outline
  subObjective: string;           // the concrete sub-skill
  type: "single" | "multi" | "dragdrop" | "dropdown" | "hotspot" | "caseStudy";
  difficulty: 1 | 2 | 3;
  stem: string;                   // markdown; may include ```DAX``` / ```M``` code blocks
  exhibit?: string;               // markdown table, model note, or M/DAX script
  options: { id: string; text: string }[];   // ids "a","b","c","d" (add "e" for multi)
  correct: string[];              // option ids. exactly 1 for single/dropdown/hotspot; >=2 for multi
  explanation: {
    why: string;                  // why the right answer is right
    whyNot: Record<string, string>; // one entry for EVERY wrong option id
  };
  sourceUrl: string;              // https://learn.microsoft.com/...
  tags: string[];                 // e.g. ["CALCULATE","filter context","context-transition"]
};
```

### Non-single types

`dragdrop`, `dropdown`, and `hotspot` are modeled as **option-selection**: describe the interaction in the `stem` and still provide `options` + `correct`. This keeps the runner simple while preserving the question's intent.

### Case studies

Add linked items under `content/questions/casestudy.json`:

```jsonc
{
  "version": "2026.04.20",
  "caseStudies": [
    {
      "id": "cs-...",
      "title": "…",
      "scenario": "markdown shared scenario (150–250 words)",
      "questions": [ /* Question[] with caseStudyId set to the case id */ ]
    }
  ]
}
```

Keep case studies to **4–5 linked questions**. The exam runner shows the scenario above every item and locks the section once submitted (no back-navigation), mirroring the real exam.

## Validation

The schema test is the guardrail. Run it before you commit:

```bash
npm run test
```

It checks, for every question:

- required fields present and correctly typed; `domain`/`type`/`difficulty` in range;
- `options` has ≥2 entries with unique ids; every `correct` id exists in `options`;
- single-answer types have exactly one correct id; `multi` has ≥2;
- `explanation.whyNot` has an entry for **every wrong option**;
- `sourceUrl` is an `https://learn.microsoft.com/` URL; ≥1 tag;
- **globally unique ids**, total stays at **120**, the domain split stays **33 / 33 / 33 / 21**, and each domain stays inside its official weight band.

> If you intentionally change the bank size or distribution, update the counts in `src/test/schema.test.ts` in the same commit — and keep every domain inside its official weight range.

## Style checklist before you open a PR / commit

- [ ] Original, not derived from any real exam.
- [ ] Scenario-first stem; the task is a real analyst decision.
- [ ] Distractors are plausible wrong approaches.
- [ ] `why` explains the answer; `whyNot` covers **each** distractor.
- [ ] `sourceUrl` opens a current Learn page that backs the answer.
- [ ] `npm run test` is green.

## Adding drills

`content/drills/dax-drills.json` holds three arrays:

- `flashcards`: `{ id, group, front, back, sourceUrl }` — `group` is one of `CALCULATE`, `filter modifiers`, `time intelligence`, `iterators`, `semi-additive`, `calculation groups`.
- `predictOutput` and `contextDrills`: `{ id, model, measure, question, options, correct, explanation, sourceUrl }`. The `model` is a tiny markdown table; the answer must be **computable from what's shown** and hinge on evaluation order / context.

Keep predict-output drills honest: compute the answer yourself before writing the options.
