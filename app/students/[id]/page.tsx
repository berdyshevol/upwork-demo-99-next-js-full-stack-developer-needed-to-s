import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent, getScores, getCues } from "@/lib/db";
import { CuePanel } from "./cue-panel";
import type { CueInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function StudentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = getStudent(id);
  if (!student) notFound();

  const scores = getScores(id);
  const cues = getCues(id);

  // Latest score per subject feeds the cue prompt (and the mock grounding).
  const latestBySubject = new Map<string, (typeof scores)[number]>();
  for (const sc of scores) latestBySubject.set(sc.subject, sc);
  const cueInput: CueInput = {
    studentName: student.name,
    targetTest: student.targetTest,
    grade: student.grade,
    scores: Array.from(latestBySubject.values()).map((sc) => ({
      subject: sc.subject,
      score: sc.score,
      max: sc.max,
    })),
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-brand hover:underline">
          ← Back to roster
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {student.name}
        </h1>
        <p className="text-sm text-slate-500">
          Grade {student.grade} · Preparing for the {student.targetTest}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Score history
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Subject</th>
                <th className="px-4 py-2 font-medium">Score</th>
                <th className="px-4 py-2 font-medium">Taken</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((sc) => (
                <tr
                  key={sc.id}
                  data-testid="score-row"
                  className="border-t border-slate-100"
                >
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {sc.subject}
                  </td>
                  <td className="px-4 py-2 tabular-nums text-slate-700">
                    {sc.score}
                    <span className="text-slate-400">/{sc.max}</span>
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(sc.takenAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CuePanel
        studentId={student.id}
        cueInput={cueInput}
        savedCues={cues.map((c) => ({
          id: c.id,
          text: c.text,
          model: c.model,
          createdAt: c.createdAt,
        }))}
      />
    </div>
  );
}
