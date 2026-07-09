import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HomePage } from "@/pages/HomePage";
import { ExamPage } from "@/pages/ExamPage";
import { StudyPage } from "@/pages/StudyPage";
import { DrillsPage } from "@/pages/DrillsPage";
import { QuestionView } from "@/components/QuestionView";
import { Markdown } from "@/components/ui/Markdown";
import { ALL_QUESTIONS, CASE_STUDIES, DRILLS } from "@/lib/content";

const noop = () => {};

// Smoke tests: render the real pages with real /content loaded through Vite's
// import.meta.glob. Catches render crashes, broken content wiring, and markdown
// rendering bugs without needing a full browser.

describe("page render smoke", () => {
  it("HomePage renders with the loaded bank size", () => {
    const html = renderToStaticMarkup(<HomePage navigate={noop} />);
    expect(html).toContain("PL-300 Exam Trainer");
    expect(html).toContain(`${ALL_QUESTIONS.length} items`);
  });

  it("ExamPage setup renders", () => {
    const html = renderToStaticMarkup(<ExamPage navigate={noop} />);
    expect(html).toContain("Exam simulator");
    expect(html).toContain("Start exam");
  });

  it("StudyPage setup renders", () => {
    const html = renderToStaticMarkup(<StudyPage navigate={noop} />);
    expect(html).toContain("Study mode");
    expect(html).toContain("Due for review");
  });

  it("DrillsPage renders the flashcards tab", () => {
    const html = renderToStaticMarkup(<DrillsPage />);
    expect(html).toContain("DAX flashcards");
  });
});

describe("content renders through QuestionView", () => {
  it("renders every question's stem and options without throwing", () => {
    for (const q of ALL_QUESTIONS) {
      const html = renderToStaticMarkup(
        <QuestionView
          question={q}
          selected={[]}
          onSelect={noop}
          flagged={false}
          onToggleFlag={noop}
          revealed
          index={0}
          total={ALL_QUESTIONS.length}
        />,
      );
      expect(html.length).toBeGreaterThan(0);
    }
  });

  it("renders the case study scenario markdown", () => {
    expect(CASE_STUDIES.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(
      <Markdown>{CASE_STUDIES[0].scenario}</Markdown>,
    );
    expect(html).toContain("md");
  });

  it("renders drill measures as DAX code blocks", () => {
    for (const d of [...DRILLS.predictOutput, ...DRILLS.contextDrills]) {
      const html = renderToStaticMarkup(<Markdown>{d.measure}</Markdown>);
      expect(html).toContain("<pre");
    }
  });
});
