import { useMemo, useState } from "react";
import { DRILLS } from "@/lib/content";
import type { Flashcard, PredictOutputDrill, DaxGroup } from "@/types/question";
import { Markdown } from "@/components/ui/Markdown";
import {
  Button,
  Card,
  CardContent,
  Badge,
} from "@/components/ui/primitives";
import { cn, shuffle } from "@/lib/utils";
import { ExternalLink, RotateCcw } from "lucide-react";

type Tab = "flashcards" | "predict" | "context";

export function DrillsPage() {
  const [tab, setTab] = useState<Tab>("flashcards");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex gap-2">
        <TabBtn active={tab === "flashcards"} onClick={() => setTab("flashcards")}>
          DAX flashcards
        </TabBtn>
        <TabBtn active={tab === "predict"} onClick={() => setTab("predict")}>
          Predict the output
        </TabBtn>
        <TabBtn active={tab === "context"} onClick={() => setTab("context")}>
          Row vs filter context
        </TabBtn>
      </div>

      {tab === "flashcards" && <Flashcards cards={DRILLS.flashcards} />}
      {tab === "predict" && (
        <PredictDrills
          drills={DRILLS.predictOutput}
          title="Predict the output"
          blurb="Given a tiny model and a measure, choose the value it returns. These evaluation-order calls are what separate a pass from a fail."
        />
      )}
      {tab === "context" && (
        <PredictDrills
          drills={DRILLS.contextDrills}
          title="Row context vs filter context"
          blurb="Context transition, iterators, and measure-vs-column behavior."
        />
      )}
    </div>
  );
}

function TabBtn({
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
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-amber-500 text-neutral-950"
          : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800",
      )}
    >
      {children}
    </button>
  );
}

function Flashcards({ cards }: { cards: Flashcard[] }) {
  const groups = useMemo(() => {
    const set = new Set<DaxGroup>();
    cards.forEach((c) => set.add(c.group));
    return ["all", ...[...set]] as (DaxGroup | "all")[];
  }, [cards]);
  const [group, setGroup] = useState<DaxGroup | "all">("all");
  const deck = useMemo(() => {
    const filtered =
      group === "all" ? cards : cards.filter((c) => c.group === group);
    return shuffle(filtered, 42);
  }, [cards, group]);

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());

  if (deck.length === 0)
    return <EmptyDrill label="No flashcards loaded." />;

  const card = deck[idx % deck.length];

  function advance(markKnown: boolean) {
    setKnown((prev) => {
      const n = new Set(prev);
      if (markKnown) n.add(card.id);
      else n.delete(card.id);
      return n;
    });
    setFlipped(false);
    setIdx((i) => (i + 1) % deck.length);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => {
              setGroup(g);
              setIdx(0);
              setFlipped(false);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              group === g
                ? "border-amber-500 bg-amber-500/10 text-amber-200"
                : "border-neutral-700 text-neutral-300 hover:border-neutral-500",
            )}
          >
            {g}
          </button>
        ))}
        <span className="ml-auto text-xs text-neutral-500">
          {known.size} marked known · {deck.length} in deck
        </span>
      </div>

      <Card
        className="min-h-[220px] cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
      >
        <CardContent className="flex min-h-[220px] flex-col justify-center pt-6">
          <Badge tone="blue" className="mb-3 self-start">
            {card.group}
          </Badge>
          {!flipped ? (
            <div className="text-center">
              <div className="text-xl font-semibold">{card.front}</div>
              <div className="mt-3 text-xs text-neutral-500">
                click to reveal
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Markdown className="text-sm text-neutral-200">{card.back}</Markdown>
              <a
                href={card.sourceUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Learn source
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500">
          Card {(idx % deck.length) + 1}/{deck.length}
        </span>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => advance(false)}>
            Need review
          </Button>
          <Button onClick={() => advance(true)}>Got it</Button>
        </div>
      </div>
    </div>
  );
}

function PredictDrills({
  drills,
  title,
  blurb,
}: {
  drills: PredictOutputDrill[];
  title: string;
  blurb: string;
}) {
  const deck = useMemo(() => shuffle(drills, 7), [drills]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  if (deck.length === 0) return <EmptyDrill label="No drills loaded." />;

  const d = deck[idx % deck.length];
  const isRight = revealed && selected && d.correct.includes(selected);

  function check() {
    if (!selected) return;
    setRevealed(true);
    setScore((s) => ({
      correct: s.correct + (d.correct.includes(selected) ? 1 : 0),
      total: s.total + 1,
    }));
  }
  function next() {
    setSelected(null);
    setRevealed(false);
    setIdx((i) => (i + 1) % deck.length);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-neutral-400">{blurb}</p>
        </div>
        <Badge tone="neutral">
          {score.correct}/{score.total}
        </Badge>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Model
            </div>
            <Markdown className="text-sm">{d.model}</Markdown>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Measure
            </div>
            <Markdown className="text-sm">{d.measure}</Markdown>
          </div>
          <div className="font-medium">{d.question}</div>

          <div className="space-y-2">
            {d.options.map((o) => {
              const right = d.correct.includes(o.id);
              const chosen = selected === o.id;
              return (
                <button
                  key={o.id}
                  disabled={revealed}
                  onClick={() => setSelected(o.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                    !revealed &&
                      (chosen
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-neutral-800 hover:border-neutral-600"),
                    revealed && right && "border-emerald-500 bg-emerald-500/10",
                    revealed &&
                      chosen &&
                      !right &&
                      "border-red-500 bg-red-500/10",
                    revealed && !right && !chosen && "border-neutral-800 opacity-60",
                  )}
                >
                  <span className="font-mono text-xs text-neutral-400">
                    {o.id.toUpperCase()}
                  </span>
                  <Markdown className="text-sm">{o.text}</Markdown>
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
              <Badge tone={isRight ? "green" : "red"}>
                {isRight ? "Correct" : "Not quite"}
              </Badge>
              <Markdown className="text-sm text-neutral-200">
                {d.explanation}
              </Markdown>
              <a
                href={d.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Learn source
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500">
          {(idx % deck.length) + 1}/{deck.length}
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelected(null);
              setRevealed(false);
            }}
            title="Clear"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          {!revealed ? (
            <Button disabled={!selected} onClick={check}>
              Check
            </Button>
          ) : (
            <Button onClick={next}>Next</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyDrill({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center text-sm text-neutral-400">
        {label}
      </CardContent>
    </Card>
  );
}
