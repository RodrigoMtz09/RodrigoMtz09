# PL-300 Exam Trainer

A local, offline web app to **learn** and **simulate** the Microsoft **PL-300: Power BI Data Analyst Associate** exam. It ships with an original, cited question bank, a realistic exam simulator (timed, case studies, flag/review), a study mode with spaced repetition, and DAX / Power Query drills.

> **No braindumps.** Every question is original, written against the official skills outline and in the style of Microsoft's free Practice Assessment. Every item cites the Microsoft Learn doc that justifies its answer.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

That's it — no backend, no accounts, no API keys. All progress is stored locally in your browser via IndexedDB (Dexie).

Other scripts:

```bash
npm run test        # validate the question bank against the schema + render smoke tests
npm run typecheck   # tsc, no emit
npm run build       # production build
```

## What's inside

| Area | What it does |
|------|--------------|
| **Exam simulator** | Timed forms (15 / 40 / full-bank), no feedback until submit, question flag + navigator, a linked **case study** section with no back-navigation once submitted. Score report: estimated scaled score, per-domain, per-tag, and time-per-question. |
| **Study mode** | Practice by domain/objective with instant feedback + full explanations. Missed items and their tags feed an **SM-2 spaced-repetition** queue ("Due for review"). |
| **Weak-spot dashboard** | Accuracy by sub-objective, score trend across attempts, and your review queue. |
| **DAX & PQ drills** | Flashcards grouped by DAX role (CALCULATE, filter modifiers, time intelligence, iterators, semi-additive, calculation groups), **predict-the-output** drills, and a dedicated **row-vs-filter-context / context-transition** set. |

### Content & weights

The bank is **120 questions** distributed to the official PL-300 weights (skills outline *as of April 20, 2026*):

| Domain | Official weight | Questions |
|--------|-----------------|-----------|
| Prepare the data | 25–30% | 33 |
| Model the data | 25–30% | 33 |
| Visualize and analyze the data | 25–30% | 33 |
| Manage and secure Power BI | 15–20% | 21 |

Passing score is **700 / 1000 scaled** — not a raw 70%.

> ⚠️ **On the scaled score:** Microsoft does not publish its scaling curve, so the app's scaled score is an **estimate** (anchored so ~70% raw ≈ 700). Treat the per-domain and per-tag breakdown as the real signal, not the single number.

## Suggested 4-week study plan

Roughly 1–1.5 hrs/day, 4 days/week. Each week: **learn → drill → practice → review**.

### Week 1 — Prepare the data (25–30%)
- **Study mode → Prepare the data**, one objective at a time (Get/connect, Profile/clean, Transform/load). Read every explanation and open the Learn source.
- Focus areas most prep skips: **Import vs DirectQuery vs Dual** storage modes (and where DirectLake fits), reference vs duplicate queries, star-schema shaping in Power Query.
- End of week: a **Quick check (15)** exam scoped mentally to Prepare; log weak sub-objectives in the dashboard.

### Week 2 — Model the data (25–30%) + DAX foundations
- **Study mode → Model the data**. Then spend real time in **Drills**:
  - Flashcards: CALCULATE, filter modifiers, time intelligence.
  - **Predict the output** and **Row vs filter context** drills — do these daily. Context transition is the single most common way people fail.
- Cover the newer objectives: **calculation groups**, **visual calculations**, DAX query view for performance triage.
- End of week: **Quick check (15)**; revisit "Due for review".

### Week 3 — Visualize & analyze (25–30%) + Manage & secure (15–20%)
- **Study mode → Visualize and analyze**: choosing the right visual, filter scope (visual/page/report), bookmarks, drillthrough, sync slicers, and the **AI visuals** (Key influencers, decomposition tree, smart narrative / Copilot).
- **Study mode → Manage and secure**: workspace roles, apps, endorsement, scheduled refresh + gateways, and **RLS** (roles + security-group membership) and **sensitivity labels**.
- End of week: **Realistic exam (40, timed)** including the case study. Read the full score report.

### Week 4 — Simulate & close gaps
- Two or three **Realistic exam (40, timed)** runs on different days. After each, work only your weakest domains/tags from the dashboard.
- Clear the **"Due for review"** SM-2 queue every day.
- Re-drill any DAX context items you still miss.
- Final 2 days: one **Full bank** pass if you want maximum coverage, then rest. Aim to consistently clear ~80%+ raw before test day to give the scaled-score estimate margin.

## Tech

Vite + React + TypeScript · Tailwind · shadcn/ui-style primitives (cva + tailwind-merge) · Zustand (session state) · Dexie / IndexedDB (persistence) · Vitest (schema + render tests). No backend.

Questions live as versioned JSON in [`/content`](./content) — never hardcoded in components. See [CONTRIBUTING.md](./CONTRIBUTING.md) to add your own.

## Disclaimer

This is an independent study aid. It is **not** affiliated with or endorsed by Microsoft, and it contains **no** real exam questions. "PL-300" and "Power BI" are Microsoft trademarks, used here for identification only.
