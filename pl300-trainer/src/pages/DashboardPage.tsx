import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { weakTags } from "@/lib/srsStore";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  Button,
} from "@/components/ui/primitives";
import { DOMAIN_LABELS } from "@/types/question";
import type { Domain } from "@/types/question";

export function DashboardPage({ navigate }: { navigate: (to: string) => void }) {
  const subStats = useLiveQuery(() => db.subObjectiveStats.toArray(), []);
  const attempts = useLiveQuery(
    () => db.attempts.where("mode").equals("exam").sortBy("finishedAt"),
    [],
  );
  const [tags, setTags] = useState<
    { tag: string; due: boolean; lapses: number; easiness: number }[]
  >([]);

  useEffect(() => {
    weakTags(Date.now(), 12).then(setTags);
  }, [subStats]);

  const hasData = (subStats?.length ?? 0) > 0 || (attempts?.length ?? 0) > 0;

  if (!hasData) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="space-y-4 pt-6 text-center">
            <div className="text-lg font-medium">No data yet</div>
            <p className="text-sm text-neutral-400">
              Take an exam or run a study session and your weak spots, trends,
              and spaced-repetition queue will show up here.
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => navigate("/exam")}>Start an exam</Button>
              <Button variant="outline" onClick={() => navigate("/study")}>
                Study
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sorted = [...(subStats ?? [])].sort(
    (a, b) => a.correct / a.seen - b.correct / b.seen,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Score trend</CardTitle>
        </CardHeader>
        <CardContent>
          {attempts && attempts.length > 0 ? (
            <TrendChart
              points={attempts.map((a) => ({
                x: a.finishedAt,
                y: a.scaledScore,
                passed: a.passed,
              }))}
            />
          ) : (
            <p className="text-sm text-neutral-400">
              No full exam attempts yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accuracy by sub-objective</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sorted.map((st) => {
            const pct = Math.round((st.correct / st.seen) * 100);
            return (
              <div key={`${st.domain}-${st.subObjective}`} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">
                    <span className="text-neutral-500">
                      {DOMAIN_LABELS[st.domain as Domain]?.split(" ")[0]} ·{" "}
                    </span>
                    {st.subObjective}
                  </span>
                  <span className="shrink-0 text-neutral-400">
                    {st.correct}/{st.seen} ({pct}%)
                  </span>
                </div>
                <Progress
                  value={pct}
                  tone={pct >= 70 ? "green" : pct >= 50 ? "amber" : "red"}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spaced-repetition weak tags</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-sm text-neutral-400">Nothing scheduled yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Badge key={t.tag} tone={t.due ? "red" : "amber"}>
                  {t.tag} · {t.lapses} miss{t.lapses === 1 ? "" : "es"}
                  {t.due ? " · due" : ""}
                </Badge>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate("/study")}>
              Review due items
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent attempts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(attempts ?? [])
            .slice()
            .reverse()
            .slice(0, 8)
            .map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm"
              >
                <span className="text-neutral-400">
                  {new Date(a.finishedAt).toLocaleString()}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-neutral-400">
                    {a.totalCorrect}/{a.totalQuestions}
                  </span>
                  <Badge tone={a.passed ? "green" : "red"}>
                    {a.scaledScore}
                  </Badge>
                </span>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TrendChart({
  points,
}: {
  points: { x: number; y: number; passed: boolean }[];
}) {
  const w = 640;
  const h = 180;
  const pad = 32;
  const ys = points.map((p) => p.y);
  const minY = Math.min(500, ...ys) - 20;
  const maxY = 1000;
  const n = points.length;
  const xFor = (i: number) =>
    n <= 1 ? pad : pad + (i / (n - 1)) * (w - 2 * pad);
  const yFor = (v: number) =>
    h - pad - ((v - minY) / (maxY - minY)) * (h - 2 * pad);

  const passY = yFor(700);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.y)}`)
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[480px]">
        {/* pass line */}
        <line
          x1={pad}
          x2={w - pad}
          y1={passY}
          y2={passY}
          stroke="#10b981"
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <text x={w - pad} y={passY - 4} fill="#10b981" fontSize="10" textAnchor="end">
          pass 700
        </text>
        {n > 1 && (
          <path d={path} fill="none" stroke="#eab308" strokeWidth={2} />
        )}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xFor(i)}
            cy={yFor(p.y)}
            r={4}
            fill={p.passed ? "#10b981" : "#ef4444"}
          />
        ))}
      </svg>
    </div>
  );
}
