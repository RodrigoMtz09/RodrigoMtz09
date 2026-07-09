import { ALL_QUESTIONS, CONTENT_VERSION, DRILLS, CASE_STUDIES } from "@/lib/content";
import { DOMAIN_ORDER, DOMAIN_LABELS, DOMAIN_WEIGHTS } from "@/types/question";
import type { Domain } from "@/types/question";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
} from "@/components/ui/primitives";
import { GraduationCap, Timer, Brain, LayoutDashboard, FunctionSquare } from "lucide-react";

export function HomePage({ navigate }: { navigate: (to: string) => void }) {
  const total = ALL_QUESTIONS.length;
  const counts = DOMAIN_ORDER.reduce(
    (acc, d) => {
      acc[d] = ALL_QUESTIONS.filter((q) => q.domain === d).length;
      return acc;
    },
    {} as Record<Domain, number>,
  );

  const tiles = [
    {
      title: "Exam simulator",
      desc: "Timed, no feedback until you submit, flag & review, case study.",
      icon: Timer,
      to: "/exam",
    },
    {
      title: "Study mode",
      desc: "Practice by domain with instant explanations + spaced repetition.",
      icon: Brain,
      to: "/study",
    },
    {
      title: "DAX & PQ drills",
      desc: "Flashcards, predict-the-output, row vs filter context.",
      icon: FunctionSquare,
      to: "/drills",
    },
    {
      title: "Weak-spot dashboard",
      desc: "Accuracy by sub-objective, score trend, review queue.",
      icon: LayoutDashboard,
      to: "/dashboard",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-8 w-8 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold">PL-300 Exam Trainer</h1>
          <p className="text-sm text-neutral-400">
            Power BI Data Analyst Associate · original questions modeled on the
            official skills outline.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <button
            key={t.to}
            onClick={() => navigate(t.to)}
            className="group text-left"
          >
            <Card className="h-full transition-colors group-hover:border-amber-500/60">
              <CardContent className="flex gap-4 pt-6">
                <t.icon className="h-6 w-6 shrink-0 text-amber-400" />
                <div>
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-sm text-neutral-400">{t.desc}</div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Question bank
            <Badge tone="neutral">{total} items</Badge>
            <Badge tone="amber">v{CONTENT_VERSION}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DOMAIN_ORDER.map((d) => {
            const [lo, hi] = DOMAIN_WEIGHTS[d];
            const pct = Math.round((counts[d] / total) * 100);
            return (
              <div key={d} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{DOMAIN_LABELS[d]}</span>
                  <span className="text-neutral-400">
                    {counts[d]} · {pct}%{" "}
                    <span className="text-neutral-600">
                      (target {lo}–{hi}%)
                    </span>
                  </span>
                </div>
                <Progress value={pct} tone="blue" />
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2 pt-1 text-xs text-neutral-500">
            <Badge tone="neutral">{CASE_STUDIES.length} case study</Badge>
            <Badge tone="neutral">{DRILLS.flashcards.length} flashcards</Badge>
            <Badge tone="neutral">
              {DRILLS.predictOutput.length + DRILLS.contextDrills.length} output drills
            </Badge>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-neutral-600">
        All progress is stored locally in your browser (IndexedDB). No account,
        no backend. Passing score is 700/1000 scaled.
      </p>
    </div>
  );
}
