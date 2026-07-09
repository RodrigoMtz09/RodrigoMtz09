import type { Question } from "@/types/question";
import type { ScoreReport } from "@/lib/scoring";
import { PASSING_SCALED } from "@/lib/scoring";
import { DOMAIN_LABELS } from "@/types/question";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Progress,
} from "@/components/ui/primitives";
import { formatDuration } from "@/lib/utils";
import type { SessionAnswer } from "@/lib/examStore";
import { QuestionView } from "@/components/QuestionView";
import { useState } from "react";

export function ExamReport({
  report,
  questions,
  answers,
  onRestart,
  onReviewHome,
}: {
  report: ScoreReport;
  questions: Question[];
  answers: Record<string, SessionAnswer>;
  onRestart: () => void;
  onReviewHome: () => void;
}) {
  const [showReview, setShowReview] = useState(false);
  const pct = Math.round(report.rawAccuracy * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Score report
            <Badge tone={report.passed ? "green" : "red"}>
              {report.passed ? "PASS (estimate)" : "BELOW PASS (estimate)"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Scaled score (est.)"
              value={String(report.scaledScore)}
              sub={`pass ≥ ${PASSING_SCALED} / 1000`}
              tone={report.passed ? "green" : "red"}
            />
            <Stat
              label="Raw accuracy"
              value={`${pct}%`}
              sub={`${report.totalCorrect}/${report.totalQuestions} correct`}
            />
            <Stat
              label="Total time"
              value={formatDuration(report.totalTimeMs)}
              sub={`avg ${formatDuration(report.avgTimeMs)}/q`}
            />
          </div>
          <p className="rounded-md bg-neutral-900 p-3 text-xs text-neutral-400">
            The scaled score is an <strong>estimate</strong>. Microsoft does not
            publish its exact scaling curve; 700 is the passing bar but is not a
            raw 70%. Use the per-domain and per-tag breakdown below to target
            study, not the single number.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By domain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.byDomain.map((d) => {
            const p = Math.round(d.accuracy * 100);
            return (
              <div key={d.domain} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{DOMAIN_LABELS[d.domain]}</span>
                  <span className="text-neutral-400">
                    {d.correct}/{d.total} ({p}%)
                  </span>
                </div>
                <Progress
                  value={p}
                  tone={p >= 70 ? "green" : p >= 50 ? "amber" : "red"}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weakest tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {report.byTag.slice(0, 14).map((t) => {
              const p = Math.round(t.accuracy * 100);
              return (
                <Badge
                  key={t.tag}
                  tone={p >= 70 ? "green" : p >= 50 ? "amber" : "red"}
                >
                  {t.tag} · {p}% ({t.correct}/{t.total})
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowReview((v) => !v)} variant="outline">
          {showReview ? "Hide" : "Review"} all questions
        </Button>
        <Button onClick={onRestart} variant="subtle">
          New exam
        </Button>
        <Button onClick={onReviewHome} variant="ghost">
          Home
        </Button>
      </div>

      {showReview && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <Card key={q.id}>
              <CardContent className="pt-5">
                <QuestionView
                  question={q}
                  selected={answers[q.id]?.selected ?? []}
                  onSelect={() => {}}
                  flagged={answers[q.id]?.flagged ?? false}
                  onToggleFlag={() => {}}
                  revealed
                  index={i}
                  total={questions.length}
                />
                <div className="mt-2 text-xs text-neutral-500">
                  Time on this question:{" "}
                  {formatDuration(answers[q.id]?.timeMs ?? 0)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "green" | "red";
}) {
  const color =
    tone === "green"
      ? "text-emerald-400"
      : tone === "red"
        ? "text-red-400"
        : "text-neutral-50";
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className={`mt-1 text-3xl font-bold ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}
