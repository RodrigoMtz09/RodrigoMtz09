import { useEffect, useMemo, useState } from "react";
import { useSession, gradeAnswer } from "@/lib/examStore";
import { CASE_STUDIES } from "@/lib/content";
import { QuestionView } from "@/components/QuestionView";
import { Markdown } from "@/components/ui/Markdown";
import {
  Button,
  Card,
  CardContent,
  Badge,
} from "@/components/ui/primitives";
import { cn, formatDuration } from "@/lib/utils";
import { Flag, Clock, LayoutGrid, AlertTriangle } from "lucide-react";

export function ExamRunner({ onSubmit }: { onSubmit: () => void }) {
  const s = useSession();
  const [now, setNow] = useState(() => Date.now());
  const [showGrid, setShowGrid] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // 1-second tick for the timer.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingMs = s.timeLimitMs
    ? Math.max(0, s.startedAt + s.timeLimitMs - now)
    : null;

  // Auto-submit when time runs out.
  useEffect(() => {
    if (remainingMs !== null && remainingMs <= 0 && !s.finished) {
      s.finish(Date.now());
      onSubmit();
    }
  }, [remainingMs, s, onSubmit]);

  const q = s.questions[s.order[s.cursor]];
  const answer = q ? s.answers[q.id] : undefined;

  const caseStudy = useMemo(
    () =>
      q?.caseStudyId
        ? CASE_STUDIES.find((c) => c.id === q.caseStudyId)
        : undefined,
    [q?.caseStudyId],
  );

  const sectionLocked = q?.caseStudyId
    ? s.lockedSections.has(q.caseStudyId)
    : false;

  const answeredCount = Object.values(s.answers).filter(
    (a) => a.selected.length > 0,
  ).length;
  const flaggedCount = Object.values(s.answers).filter((a) => a.flagged).length;

  if (!q) return null;

  // Is the NEXT question the start of a case-study section boundary the user
  // hasn't entered yet? Used to warn before entering.
  const nextIdx = s.order[s.cursor + 1];
  const nextQ = nextIdx != null ? s.questions[nextIdx] : undefined;
  const crossingIntoCase =
    !q.caseStudyId && nextQ?.caseStudyId && !s.lockedSections.has(nextQ.caseStudyId);

  const caseItems = q.caseStudyId
    ? s.order
        .map((oi) => s.questions[oi])
        .filter((x) => x.caseStudyId === q.caseStudyId)
    : [];
  const isLastCaseItem =
    !!q.caseStudyId && caseItems[caseItems.length - 1]?.id === q.id;

  const canGoPrev = (() => {
    const prevIdx = s.order[s.cursor - 1];
    if (prevIdx == null) return false;
    const prevQ = s.questions[prevIdx];
    // Cannot return into a locked case-study section.
    if (prevQ.caseStudyId && s.lockedSections.has(prevQ.caseStudyId))
      return false;
    return true;
  })();

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-neutral-800 bg-neutral-950/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">Exam mode</span>
          <Badge tone="neutral">
            {answeredCount}/{s.questions.length} answered
          </Badge>
          {flaggedCount > 0 && (
            <Badge tone="amber">
              <Flag className="mr-1 inline h-3 w-3" />
              {flaggedCount}
            </Badge>
          )}
          {remainingMs !== null && (
            <span
              className={cn(
                "ml-auto inline-flex items-center gap-1.5 font-mono text-base font-semibold tabular-nums",
                remainingMs < 5 * 60_000 ? "text-red-400" : "text-neutral-100",
              )}
            >
              <Clock className="h-4 w-4" />
              {formatDuration(remainingMs)}
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className={remainingMs === null ? "ml-auto" : ""}
            onClick={() => setShowGrid((v) => !v)}
          >
            <LayoutGrid className="h-4 w-4" />
            Review
          </Button>
        </div>
      </div>

      {showGrid && (
        <ReviewGrid
          onClose={() => setShowGrid(false)}
          onJump={(cursor) => {
            s.goTo(cursor, Date.now());
            setShowGrid(false);
          }}
        />
      )}

      {/* Case-study scenario */}
      {caseStudy && (
        <Card className="mb-4 border-sky-800/50 bg-sky-950/20">
          <CardContent className="pt-5">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="blue">Case study</Badge>
              <span className="font-semibold">{caseStudy.title}</span>
              {sectionLocked && <Badge tone="red">Section submitted</Badge>}
            </div>
            <Markdown className="text-sm text-neutral-200">
              {caseStudy.scenario}
            </Markdown>
            <div className="mt-2 text-xs text-neutral-500">
              This section has {caseItems.length} linked questions. Once you
              submit the section you cannot return to it.
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <QuestionView
            question={q}
            selected={answer?.selected ?? []}
            onSelect={(oid) => s.select(q.id, oid, q.type === "multi")}
            flagged={answer?.flagged ?? false}
            onToggleFlag={() => s.toggleFlag(q.id)}
            revealed={false}
            index={s.cursor}
            total={s.questions.length}
          />
        </CardContent>
      </Card>

      {/* Footer nav */}
      <div className="mt-4 flex items-center gap-3">
        <Button
          variant="outline"
          disabled={!canGoPrev}
          onClick={() => s.prev(Date.now())}
        >
          Back
        </Button>

        <div className="ml-auto flex items-center gap-3">
          {isLastCaseItem && !sectionLocked ? (
            <Button
              variant="subtle"
              onClick={() => {
                s.lockSection(q.caseStudyId!);
                s.next(Date.now());
              }}
            >
              Submit section & continue
            </Button>
          ) : s.cursor < s.order.length - 1 ? (
            <Button
              onClick={() => {
                s.next(Date.now());
              }}
            >
              {crossingIntoCase ? "Continue to case study" : "Next"}
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => setConfirmSubmit(true)}
            >
              Submit exam
            </Button>
          )}
        </div>
      </div>

      {s.cursor === s.order.length - 1 && (
        <div className="mt-3 text-center text-xs text-neutral-500">
          You can also submit from here at any time.{" "}
          <button
            className="text-amber-400 hover:underline"
            onClick={() => setConfirmSubmit(true)}
          >
            Submit exam now
          </button>
        </div>
      )}

      {confirmSubmit && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <Card className="max-w-md">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Submit exam?</span>
              </div>
              <p className="text-sm text-neutral-300">
                You answered {answeredCount} of {s.questions.length} questions.
                {answeredCount < s.questions.length &&
                  " Unanswered questions are scored as incorrect."}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setConfirmSubmit(false)}>
                  Keep working
                </Button>
                <Button
                  onClick={() => {
                    s.finish(Date.now());
                    onSubmit();
                  }}
                >
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ReviewGrid({
  onJump,
  onClose,
}: {
  onJump: (cursor: number) => void;
  onClose: () => void;
}) {
  const s = useSession();
  return (
    <Card className="mb-4">
      <CardContent className="pt-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">Question navigator</span>
          <button
            className="text-xs text-neutral-400 hover:text-neutral-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
          {s.order.map((oi, cursor) => {
            const q = s.questions[oi];
            const a = s.answers[q.id];
            const locked = q.caseStudyId
              ? s.lockedSections.has(q.caseStudyId)
              : false;
            const answered = (a?.selected.length ?? 0) > 0;
            return (
              <button
                key={q.id}
                disabled={locked}
                onClick={() => onJump(cursor)}
                className={cn(
                  "relative flex h-9 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                  locked && "cursor-not-allowed opacity-40",
                  cursor === s.cursor && "ring-2 ring-amber-400",
                  answered
                    ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                    : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-500",
                )}
              >
                {cursor + 1}
                {a?.flagged && (
                  <Flag className="absolute -right-1 -top-1 h-3 w-3 text-amber-400" />
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
          <span>
            <span className="mr-1 inline-block h-3 w-3 rounded border border-amber-500/60 bg-amber-500/15 align-middle" />
            answered
          </span>
          <span>
            <Flag className="mr-1 inline h-3 w-3 text-amber-400" />
            flagged
          </span>
          <span className="opacity-60">dimmed = submitted case section</span>
        </div>
      </CardContent>
    </Card>
  );
}

export { gradeAnswer };
