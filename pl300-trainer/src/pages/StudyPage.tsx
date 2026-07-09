import { useEffect, useMemo, useState } from "react";
import type { Domain, Question } from "@/types/question";
import { DOMAIN_LABELS, DOMAIN_ORDER } from "@/types/question";
import {
  ALL_QUESTIONS,
  questionsByDomain,
  objectivesForDomain,
  questionById,
} from "@/lib/content";
import { useSession } from "@/lib/examStore";
import { QuestionView } from "@/components/QuestionView";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
} from "@/components/ui/primitives";
import { shuffle } from "@/lib/utils";
import { isCorrect } from "@/lib/scoring";
import { db, recordSubObjectiveResults } from "@/lib/db";
import { upsertSrsFromResults, dueQuestionIds, srsSummary } from "@/lib/srsStore";

type Mode = "setup" | "running" | "done";

export function StudyPage({ navigate }: { navigate: (to: string) => void }) {
  const session = useSession();
  const [mode, setMode] = useState<Mode>("setup");
  const [domain, setDomain] = useState<Domain | "all">("all");
  const [objective, setObjective] = useState<string>("all");
  const [size, setSize] = useState(15);
  const [dueOnly, setDueOnly] = useState(false);
  const [srs, setSrs] = useState({ tracked: 0, due: 0 });
  const [results, setResults] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });

  useEffect(() => {
    srsSummary(Date.now()).then(setSrs);
  }, [mode]);

  const objectives = useMemo(
    () => (domain === "all" ? [] : objectivesForDomain(domain)),
    [domain],
  );

  async function start() {
    let pool: Question[];
    if (dueOnly) {
      const ids = await dueQuestionIds(Date.now());
      pool = ids.map((id) => questionById(id)).filter(Boolean) as Question[];
      if (pool.length === 0) pool = shuffle(ALL_QUESTIONS).slice(0, size);
    } else {
      pool = domain === "all" ? ALL_QUESTIONS : questionsByDomain(domain);
      if (objective !== "all") pool = pool.filter((q) => q.objective === objective);
      pool = shuffle(pool);
    }
    const picked = pool.slice(0, Math.min(size, pool.length));
    session.start({ mode: "study", questions: picked, now: Date.now() });
    setResults({ correct: 0, total: 0 });
    setMode("running");
  }

  if (mode === "running") {
    return (
      <StudyRunner
        onDone={(r) => {
          setResults(r);
          setMode("done");
        }}
      />
    );
  }

  if (mode === "done") {
    const pct = results.total
      ? Math.round((results.correct / results.total) * 100)
      : 0;
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Session complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold">
              {results.correct}/{results.total}{" "}
              <span className="text-lg font-normal text-neutral-400">
                ({pct}%)
              </span>
            </div>
            <Progress value={pct} tone={pct >= 70 ? "green" : "amber"} />
            <p className="text-sm text-neutral-400">
              Missed items and their tags were scheduled for spaced repetition.
              Come back to “Due for review” to reinforce them.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setMode("setup")}>New session</Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Weak-spot dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Study mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <button
            onClick={() => setDueOnly((v) => !v)}
            className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
              dueOnly
                ? "border-amber-500 bg-amber-500/10"
                : "border-neutral-800 hover:border-neutral-600"
            }`}
          >
            <div>
              <div className="text-sm font-medium">Due for review (SM-2)</div>
              <div className="text-xs text-neutral-400">
                Spaced-repetition queue over your missed questions.
              </div>
            </div>
            <Badge tone={srs.due > 0 ? "amber" : "neutral"}>
              {srs.due} due · {srs.tracked} tracked
            </Badge>
          </button>

          {!dueOnly && (
            <>
              <div>
                <div className="mb-2 text-sm font-medium text-neutral-300">
                  Domain
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    active={domain === "all"}
                    onClick={() => {
                      setDomain("all");
                      setObjective("all");
                    }}
                  >
                    All domains
                  </FilterChip>
                  {DOMAIN_ORDER.map((d) => (
                    <FilterChip
                      key={d}
                      active={domain === d}
                      onClick={() => {
                        setDomain(d);
                        setObjective("all");
                      }}
                    >
                      {DOMAIN_LABELS[d]}
                    </FilterChip>
                  ))}
                </div>
              </div>

              {domain !== "all" && (
                <div>
                  <div className="mb-2 text-sm font-medium text-neutral-300">
                    Objective
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      active={objective === "all"}
                      onClick={() => setObjective("all")}
                    >
                      All
                    </FilterChip>
                    {objectives.map((o) => (
                      <FilterChip
                        key={o}
                        active={objective === o}
                        onClick={() => setObjective(o)}
                      >
                        {o}
                      </FilterChip>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <div className="mb-2 text-sm font-medium text-neutral-300">
              Session length: {size}
            </div>
            <input
              type="range"
              min={5}
              max={40}
              step={5}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <Button size="lg" className="w-full" onClick={start}>
            Start studying
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-amber-500 bg-amber-500/10 text-amber-200"
          : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
      }`}
    >
      {children}
    </button>
  );
}

function StudyRunner({
  onDone,
}: {
  onDone: (r: { correct: number; total: number }) => void;
}) {
  const s = useSession();
  const [correctCount, setCorrectCount] = useState(0);

  const q = s.questions[s.order[s.cursor]];
  const answer = q ? s.answers[q.id] : undefined;
  const revealed = answer?.revealed ?? false;

  if (!q) return null;

  const hasSelection = (answer?.selected.length ?? 0) > 0;
  const correct = revealed ? isCorrect(q, answer?.selected ?? []) : false;

  async function check() {
    if (!q) return;
    s.commitTime(Date.now());
    s.reveal(q.id);
    const wasCorrect = isCorrect(q, s.answers[q.id]?.selected ?? []);
    if (wasCorrect) setCorrectCount((c) => c + 1);
    const now = Date.now();
    await upsertSrsFromResults(
      [
        {
          questionId: q.id,
          tags: q.tags,
          correct: wasCorrect,
          timeMs: s.answers[q.id]?.timeMs ?? 0,
        },
      ],
      now,
    );
    await recordSubObjectiveResults(
      [{ subObjective: q.subObjective, domain: q.domain, correct: wasCorrect }],
      now,
    );
    await db.attempts.add({
      startedAt: now,
      finishedAt: now,
      mode: "study",
      totalQuestions: 1,
      totalCorrect: wasCorrect ? 1 : 0,
      scaledScore: 0,
      passed: false,
      answers: [
        {
          questionId: q.id,
          domain: q.domain,
          subObjective: q.subObjective,
          tags: q.tags,
          selected: s.answers[q.id]?.selected ?? [],
          correct: wasCorrect,
          timeMs: s.answers[q.id]?.timeMs ?? 0,
        },
      ],
    });
  }

  function next() {
    if (s.cursor >= s.order.length - 1) {
      onDone({ correct: correctCount, total: s.questions.length });
      s.reset();
    } else {
      s.next(Date.now());
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Progress
          value={((s.cursor + 1) / s.questions.length) * 100}
          className="flex-1"
        />
        <span className="text-xs text-neutral-400">
          {s.cursor + 1}/{s.questions.length}
        </span>
      </div>

      <Card>
        <CardContent className="pt-5">
          <QuestionView
            question={q}
            selected={answer?.selected ?? []}
            onSelect={(oid) => s.select(q.id, oid, q.type === "multi")}
            flagged={answer?.flagged ?? false}
            onToggleFlag={() => s.toggleFlag(q.id)}
            revealed={revealed}
            index={s.cursor}
            total={s.questions.length}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        {revealed && (
          <Badge tone={correct ? "green" : "red"}>
            {correct ? "Correct" : "Incorrect"}
          </Badge>
        )}
        <div className="ml-auto">
          {!revealed ? (
            <Button disabled={!hasSelection} onClick={check}>
              Check answer
            </Button>
          ) : (
            <Button onClick={next}>
              {s.cursor >= s.order.length - 1 ? "Finish" : "Next"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
