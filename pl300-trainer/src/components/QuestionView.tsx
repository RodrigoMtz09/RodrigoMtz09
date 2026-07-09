import type { Question } from "@/types/question";
import { Markdown } from "@/components/ui/Markdown";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { Check, X, Flag, ExternalLink } from "lucide-react";

const TYPE_HINT: Record<Question["type"], string> = {
  single: "Choose ONE answer.",
  multi: "Choose ALL that apply.",
  dropdown: "Select the correct option.",
  dragdrop: "Select the option that places items correctly.",
  hotspot: "Select the correct statement.",
  caseStudy: "Case study item.",
};

export function QuestionView({
  question,
  selected,
  onSelect,
  flagged,
  onToggleFlag,
  revealed,
  index,
  total,
}: {
  question: Question;
  selected: string[];
  onSelect: (optionId: string) => void;
  flagged: boolean;
  onToggleFlag: () => void;
  revealed: boolean;
  index: number;
  total: number;
}) {
  const isMulti = question.type === "multi";
  const correctSet = new Set(question.correct);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
        <span className="font-mono">
          Q{index + 1}/{total}
        </span>
        <Badge tone="blue">{question.objective}</Badge>
        <Badge tone="neutral">{question.subObjective}</Badge>
        <Badge tone="amber">Difficulty {question.difficulty}</Badge>
        {question.caseStudyId && <Badge tone="green">Case study</Badge>}
        <button
          onClick={onToggleFlag}
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors",
            flagged
              ? "bg-amber-500/20 text-amber-300"
              : "text-neutral-400 hover:bg-neutral-800",
          )}
          aria-pressed={flagged}
        >
          <Flag className="h-3.5 w-3.5" />
          {flagged ? "Flagged" : "Flag"}
        </button>
      </div>

      <div className="text-[13px] uppercase tracking-wide text-amber-400/80">
        {TYPE_HINT[question.type]}
      </div>

      <Markdown className="text-[15px] text-neutral-100">{question.stem}</Markdown>

      {question.exhibit && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-3">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Exhibit
          </div>
          <Markdown className="text-sm">{question.exhibit}</Markdown>
        </div>
      )}

      <div className="space-y-2">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const isRight = correctSet.has(opt.id);
          let state: "idle" | "correct" | "wrong" | "missed" = "idle";
          if (revealed) {
            if (isSelected && isRight) state = "correct";
            else if (isSelected && !isRight) state = "wrong";
            else if (!isSelected && isRight) state = "missed";
          }
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              disabled={revealed}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                state === "idle" &&
                  (isSelected
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-600"),
                state === "correct" && "border-emerald-500 bg-emerald-500/10",
                state === "wrong" && "border-red-500 bg-red-500/10",
                state === "missed" && "border-emerald-500/50 bg-emerald-500/5",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-semibold",
                  isMulti ? "rounded" : "rounded-full",
                  isSelected
                    ? "border-amber-400 bg-amber-500 text-neutral-950"
                    : "border-neutral-600 text-neutral-400",
                )}
              >
                {revealed && isRight ? (
                  <Check className="h-3.5 w-3.5" />
                ) : revealed && isSelected && !isRight ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  opt.id.toUpperCase()
                )}
              </span>
              <span className="text-sm text-neutral-100">
                <Markdown className="text-sm">{opt.text}</Markdown>
              </span>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/70 p-4">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Why this is correct
            </div>
            <Markdown className="text-sm text-neutral-200">
              {question.explanation.why}
            </Markdown>
          </div>
          {Object.keys(question.explanation.whyNot ?? {}).length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-400">
                Why the others are wrong
              </div>
              <ul className="space-y-1 text-sm text-neutral-300">
                {Object.entries(question.explanation.whyNot).map(([oid, txt]) => (
                  <li key={oid}>
                    <span className="font-semibold text-neutral-400">
                      {oid.toUpperCase()}.
                    </span>{" "}
                    {txt}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <a
            href={question.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Microsoft Learn source
          </a>
          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {question.tags.map((t) => (
                <Badge key={t} tone="neutral">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
