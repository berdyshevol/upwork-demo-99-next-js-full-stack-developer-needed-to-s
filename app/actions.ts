"use server";

import { revalidatePath } from "next/cache";
import { addCue } from "@/lib/db";

// Persist a generated cue to the store. The LLM call itself happens in the
// browser (BYOK); only the resulting text + model label reach the server, so
// no provider key is ever sent to or stored on our side.
export async function saveCue(input: {
  studentId: string;
  text: string;
  model: string;
}) {
  const text = input.text?.trim();
  if (!text) {
    throw new Error("Cannot save an empty cue.");
  }
  const cue = addCue({
    studentId: input.studentId,
    text,
    model: input.model || "unknown",
    createdAt: new Date().toISOString(),
  });
  revalidatePath(`/students/${input.studentId}`);
  return cue;
}
