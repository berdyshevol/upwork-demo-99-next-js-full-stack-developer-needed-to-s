import "server-only";

// In-memory data store, seeded from JSON-like literals.
// This stands in for Supabase/Postgres for the demo: real read/write semantics
// (the dashboard reads it, "Generate Cue" writes to it, reload reads it back)
// without requiring any external keys at runtime — Vercel-safe.

export type Student = {
  id: string;
  name: string;
  grade: number;
  targetTest: "SAT" | "ACT";
};

export type Score = {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  max: number;
  takenAt: string; // ISO date
};

export type Cue = {
  id: string;
  studentId: string;
  text: string;
  model: string;
  createdAt: string;
};

type DB = {
  students: Student[];
  scores: Score[];
  cues: Cue[];
  seq: number;
};

// Persist the store on globalThis so it survives Next.js hot-reloads in dev
// and stays alive across requests within a warm serverless instance.
const globalForDb = globalThis as unknown as { __lafayetteDb?: DB };

function seed(): DB {
  const students: Student[] = [
    { id: "1", name: "Maya Hernandez", grade: 11, targetTest: "SAT" },
    { id: "2", name: "Devon Carter", grade: 12, targetTest: "ACT" },
    { id: "3", name: "Priya Nair", grade: 11, targetTest: "SAT" },
    { id: "4", name: "Liam O'Brien", grade: 10, targetTest: "SAT" },
    { id: "5", name: "Sofia Rossi", grade: 12, targetTest: "ACT" },
  ];

  const scores: Score[] = [
    // Maya — strong reading, weaker math
    s("1", "Math", 540, 800, "2026-02-10"),
    s("1", "Reading", 690, 800, "2026-02-10"),
    s("1", "Writing", 660, 800, "2026-03-15"),
    s("1", "Math", 580, 800, "2026-04-20"),
    // Devon — ACT sections, science is the gap
    s("2", "Math", 27, 36, "2026-02-02"),
    s("2", "Reading", 29, 36, "2026-02-02"),
    s("2", "Science", 22, 36, "2026-03-09"),
    s("2", "Writing", 25, 36, "2026-03-09"),
    // Priya — consistently high, plateauing in writing
    s("3", "Math", 760, 800, "2026-01-18"),
    s("3", "Reading", 720, 800, "2026-01-18"),
    s("3", "Writing", 700, 800, "2026-03-22"),
    // Liam — early, reading is weakest
    s("4", "Math", 610, 800, "2026-03-01"),
    s("4", "Reading", 520, 800, "2026-03-01"),
    // Sofia — ACT, balanced but math dips
    s("5", "Math", 24, 36, "2026-02-14"),
    s("5", "Reading", 31, 36, "2026-02-14"),
    s("5", "Science", 28, 36, "2026-04-05"),
  ];

  return { students, scores, cues: [], seq: 1000 };
}

function s(
  studentId: string,
  subject: string,
  score: number,
  max: number,
  takenAt: string
): Score {
  // ids are deterministic from content order via the seeding pass below
  return { id: "", studentId, subject, score, max, takenAt };
}

function getDb(): DB {
  if (!globalForDb.__lafayetteDb) {
    const db = seed();
    // Assign stable score ids.
    db.scores.forEach((sc, i) => (sc.id = `sc-${i + 1}`));
    globalForDb.__lafayetteDb = db;
  }
  return globalForDb.__lafayetteDb;
}

export function getStudents(): Student[] {
  return getDb().students;
}

export function getStudent(id: string): Student | undefined {
  return getDb().students.find((st) => st.id === id);
}

export function getScores(studentId: string): Score[] {
  return getDb()
    .scores.filter((sc) => sc.studentId === studentId)
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt));
}

export function getLatestScores(studentId: string): Score[] {
  // Most recent score per subject — what the dashboard chips show.
  const latest = new Map<string, Score>();
  for (const sc of getScores(studentId)) {
    latest.set(sc.subject, sc); // sorted ascending, so last wins
  }
  return Array.from(latest.values());
}

export function getCues(studentId: string): Cue[] {
  return getDb()
    .cues.filter((c) => c.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addCue(input: {
  studentId: string;
  text: string;
  model: string;
  createdAt: string;
}): Cue {
  const db = getDb();
  const cue: Cue = {
    id: `cue-${++db.seq}`,
    studentId: input.studentId,
    text: input.text,
    model: input.model,
    createdAt: input.createdAt,
  };
  db.cues.unshift(cue);
  return cue;
}
