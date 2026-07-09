import { useMemo, useState } from "react";
import { buildExam } from "@/features/exam/buildExam";
import { ExamRunner } from "@/features/exam/ExamRunner";
import { ExamReport } from "@/features/exam/ExamReport";
import { useSession } from "@/lib/examStore";
import {
  buildScoreReport,
  isCorrect,
  type AnswerRecord,
  type ScoreReport,
} from "@/lib/scoring";
import { db, recordSubObjectiveResults } from "@/lib/db";
import { upsertSrsFromResults } from "@/lib/srsStore";
import { ALL_QUESTIONS, CASE_STUDIES } from "@/lib/content";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui/primitives";

type Phase = "setup" | "running" | "report";

const PRESETS = [
  { label: "Quick check", size: 15, timeLimitMin: 20 },
  { label: "Realistic exam", size: 40, timeLimitMin: 60 },
  { label: "Full bank", size: ALL_QUESTIONS.length, timeLimitMin: 150 },
];

export function ExamPage({ navigate }: { navigate: (to: string) => void }) {
  const session = useSession();
  const [phase, setPhase] = useState<Phase>("setup");
  const [report, setReport] = useState<ScoreReport | null>(null);
  const [presetIdx, setPresetIdx] = useState(1);
  const [includeCaseStudy, setIncludeCaseStudy] = useState(true);
  const [timed, setTimed] = useState(true);

  const finishedQuestions = useMemo(
    () => session.questions,
    // capture at report time
    [phase], // eslint-disable-line react-hooks/exhaustive-deps
  );

  function startExam() {
    const preset = PRESETS[presetIdx];
    const { questions } = buildExam({
      size: preset.size,
      includeCaseStudy,
      timeLimitMin: timed ? preset.timeLimitMin : null,
      seed: Date.now(),
    });
    session.start({
      mode: "exam",
      questions,
      timeLimitMs: timed ? preset.timeLimitMin * 60_000 : null,
      now: Date.now(),
    });
    setPhase("running");
  }

  async function handleSubmit() {
    const qs = session.questions;
    const answerRecords: Record<string, AnswerRecord> = {};
    for (const q of qs) {
      const a = session.answers[q.id];
      const selected = a?.selected ?? [];
      answerRecords[q.id] = {
        questionId: q.id,
        selected,
        correct: isCorrect(q, selected),
        timeMs: a?.timeMs ?? 0,
        flagged: a?.flagged ?? false,
      };
    }
    const rpt = buildScoreReport(qs, answerRecords);
    setReport(rpt);

    // Persist attempt + progress signals.
    const now = Date.now();
    await db.attempts.add({
      startedAt: session.startedAt,
      finishedAt: now,
      mode: "exam",
      totalQuestions: rpt.totalQuestions,
      totalCorrect: rpt.totalCorrect,
      scaledScore: rpt.scaledScore,
      passed: rpt.passed,
      answers: qs.map((q) => ({
        questionId: q.id,
        domain: q.domain,
        subObjective: q.subObjective,
        tags: q.tags,
        selected: answerRecords[q.id].selected,
        correct: answerRecords[q.id].correct,
        timeMs: answerRecords[q.id].timeMs,
      })),
    });
    await recordSubObjectiveResults(
      qs.map((q) => ({
        subObjective: q.subObjective,
        domain: q.domain,
        correct: answerRecords[q.id].correct,
      })),
      now,
    );
    await upsertSrsFromResults(
      qs.map((q) => ({
        questionId: q.id,
        tags: q.tags,
        correct: answerRecords[q.id].correct,
        timeMs: answerRecords[q.id].timeMs,
      })),
      now,
    );

    setPhase("report");
  }

  if (phase === "running") {
    return <ExamRunner onSubmit={handleSubmit} />;
  }

  if (phase === "report" && report) {
    return (
      <ExamReport
        report={report}
        questions={finishedQuestions}
        answers={session.answers}
        onRestart={() => {
          session.reset();
          setReport(null);
          setPhase("setup");
        }}
        onReviewHome={() => {
          session.reset();
          navigate("/");
        }}
      />
    );
  }

  const preset = PRESETS[presetIdx];
  const hasCaseStudy = CASE_STUDIES.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exam simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 text-sm font-medium text-neutral-300">
              Form length
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => setPresetIdx(i)}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                    presetIdx === i
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-neutral-400">
                    {p.size} questions · {p.timeLimitMin} min
                  </div>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-neutral-800 p-3">
            <div>
              <div className="text-sm font-medium">Timed</div>
              <div className="text-xs text-neutral-400">
                Auto-submits at {preset.timeLimitMin} min, like the real exam.
              </div>
            </div>
            <input
              type="checkbox"
              checked={timed}
              onChange={(e) => setTimed(e.target.checked)}
              className="h-5 w-5 accent-amber-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-neutral-800 p-3">
            <div>
              <div className="text-sm font-medium">
                Include case study{" "}
                {!hasCaseStudy && <Badge tone="red">none loaded</Badge>}
              </div>
              <div className="text-xs text-neutral-400">
                A linked multi-question section with no back-navigation once
                submitted.
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeCaseStudy && hasCaseStudy}
              disabled={!hasCaseStudy}
              onChange={(e) => setIncludeCaseStudy(e.target.checked)}
              className="h-5 w-5 accent-amber-500"
            />
          </label>

          <div className="rounded-md bg-neutral-900 p-3 text-xs text-neutral-400">
            Exam mode gives <strong>no feedback until you submit</strong>. You
            can flag questions and jump around via the navigator, except inside a
            submitted case-study section.
          </div>

          <Button size="lg" className="w-full" onClick={startExam}>
            Start exam ({preset.size} questions)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
