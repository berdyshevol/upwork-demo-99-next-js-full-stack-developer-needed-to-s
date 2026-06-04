"use client";

import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { BYOK_STORAGE_KEY, type Byok, type CueInput } from "./types";

// Read the visitor's Bring-Your-Own-Key config from localStorage.
// Returns null when nothing usable is saved → callers keep AI features gated.
export function readByok(): Byok | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BYOK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Byok>;
    if (!parsed.provider || !parsed.apiKey || !parsed.model) return null;
    return parsed as Byok;
  } catch {
    return null;
  }
}

// Resolve the right AI SDK model instance for the visitor's provider/key.
// The factories run in the browser, so the request goes browser → provider
// directly and never touches our Vercel server (no server-side billing).
function resolveModel(byok: Byok) {
  switch (byok.provider) {
    case "anthropic":
      return createAnthropic({ apiKey: byok.apiKey })(byok.model);
    case "openai":
      return createOpenAI({ apiKey: byok.apiKey })(byok.model);
    case "google":
      return createGoogleGenerativeAI({ apiKey: byok.apiKey })(byok.model);
    default:
      throw new Error(`Unsupported provider: ${byok.provider}`);
  }
}

function buildPrompt(input: CueInput): string {
  const lines = input.scores
    .map((s) => `- ${s.subject}: ${s.score} / ${s.max}`)
    .join("\n");
  return [
    `You are an instructional coach at Lafayette Academy, a college-prep tutoring center.`,
    `Write a 2-3 sentence "Personalization Cue" for the instructor working with ${input.studentName}, a grade ${input.grade} student preparing for the ${input.targetTest}.`,
    `Ground every sentence in this student's actual recent scores:`,
    lines,
    `Name the specific subject that needs the most attention and one concrete next session focus. Address the instructor, not the student. Be specific and actionable; do not invent data.`,
  ].join("\n");
}

// Deterministic, offline cue for the "mock" provider used by tests and by the
// default no-real-key demo state. Grounded in the supplied scores.
function mockCue(input: CueInput): string {
  const weakest = [...input.scores].sort(
    (a, b) => a.score / a.max - b.score / b.max
  )[0];
  const strongest = [...input.scores].sort(
    (a, b) => b.score / b.max - a.score / a.max
  )[0];
  const w = weakest ? weakest.subject : "Math";
  const wv = weakest ? `${weakest.score}/${weakest.max}` : "—";
  const st = strongest ? strongest.subject : "Reading";
  return (
    `${input.studentName} is tracking well in ${st} but ${w} is the clear gap on the ${input.targetTest}, ` +
    `most recently ${wv}. Anchor the next session on targeted ${w} drills — short, timed sets with immediate review — ` +
    `and reuse ${input.studentName}'s ${st} confidence to keep momentum high.`
  );
}

// Generate a coaching cue. For provider "mock" returns canned, deterministic
// text (no network). For real providers, calls the AI SDK from the browser.
export async function generateCue(
  input: CueInput,
  byok: Byok
): Promise<string> {
  if (byok.provider === "mock") {
    return mockCue(input);
  }
  const { text } = await generateText({
    model: resolveModel(byok),
    prompt: buildPrompt(input),
  });
  return text.trim();
}
