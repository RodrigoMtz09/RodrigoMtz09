import { useHashRoute } from "@/lib/router";
import { HomePage } from "@/pages/HomePage";
import { ExamPage } from "@/pages/ExamPage";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/exam", label: "Exam" },
];

export default function App() {
  const [path, navigate] = useHashRoute();
  const base = "/" + (path.split("/").filter(Boolean)[0] ?? "");

  return (
    <div className="min-h-full">
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="mr-3 flex items-center gap-2 font-semibold"
          >
            <GraduationCap className="h-5 w-5 text-amber-400" />
            <span className="hidden sm:inline">PL-300 Trainer</span>
          </button>
          <nav className="flex gap-1">
            {NAV.map((n) => (
              <button
                key={n.to}
                onClick={() => navigate(n.to)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  base === n.to
                    ? "bg-neutral-800 text-neutral-50"
                    : "text-neutral-400 hover:text-neutral-100",
                )}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Route path={path} navigate={navigate} />
      </main>
    </div>
  );
}

function Route({
  path,
  navigate,
}: {
  path: string;
  navigate: (to: string) => void;
}) {
  const base = "/" + (path.split("/").filter(Boolean)[0] ?? "");
  switch (base) {
    case "/exam":
      return <ExamPage navigate={navigate} />;
    default:
      return <HomePage navigate={navigate} />;
  }
}
