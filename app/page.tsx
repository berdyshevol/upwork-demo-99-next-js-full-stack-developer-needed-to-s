import Link from "next/link";
import { getStudents, getLatestScores, getCues } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function scoreTone(pct: number): string {
  if (pct >= 0.85) return "bg-emerald-100 text-emerald-800";
  if (pct >= 0.65) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

export default function Dashboard() {
  const students = getStudents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Instructor roster</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Each student&apos;s most recent section scores, pulled live from the
          database. Open a student to see their full score history and generate
          a personalization cue for your next session.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {students.map((student) => {
          const latest = getLatestScores(student.id);
          const cueCount = getCues(student.id).length;
          return (
            <li key={student.id} data-testid="student-row">
              <Link
                href={`/students/${student.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {student.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Grade {student.grade} · Target: {student.targetTest}
                    </p>
                  </div>
                  {cueCount > 0 && (
                    <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-dark">
                      {cueCount} cue{cueCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {latest.map((sc) => (
                    <span
                      key={sc.id}
                      data-testid="score-chip"
                      className={`rounded-md px-2 py-1 text-xs font-medium ${scoreTone(
                        sc.score / sc.max
                      )}`}
                    >
                      {sc.subject} {sc.score}
                      <span className="opacity-60">/{sc.max}</span>
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
