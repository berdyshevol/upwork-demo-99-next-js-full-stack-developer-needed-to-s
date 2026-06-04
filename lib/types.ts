// Shared, runtime-agnostic types used by both client and server modules.

export type Provider = "anthropic" | "openai" | "google" | "mock";

export type Byok = {
  provider: Provider;
  apiKey: string;
  model: string;
};

export type CueInput = {
  studentName: string;
  targetTest: string;
  grade: number;
  scores: { subject: string; score: number; max: number }[];
};

export const BYOK_STORAGE_KEY = "byok";
