"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateCue, readByok } from "@/lib/llm";
import type { Byok, CueInput } from "@/lib/types";
import { saveCue } from "@/app/actions";

type SavedCue = {
  id: string;
  text: string;
  model: string;
  createdAt: string;
};

export function CuePanel({
  studentId,
  cueInput,
  savedCues,
}: {
  studentId: string;
  cueInput: CueInput;
  savedCues: SavedCue[];
}) {
  const router = useRouter();
  const [byok, setByok] = useState<Byok | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Optimistic copy of the freshly generated cue so it appears instantly,
  // before the server round-trip / refresh re-renders the persisted list.
  const [fresh, setFresh] = useState<SavedCue | null>(null);

  useEffect(() => {
    setByok(readByok());
  }, []);

  const hasKey = !!byok;

  async function onGenerate() {
    if (!byok) return;
    setLoading(true);
    setError(null);
    try {
      const text = await generateCue(cueInput, byok);
      const modelLabel = `${byok.provider}:${byok.model}`;
      setFresh({
        id: "fresh",
        text,
        model: modelLabel,
        createdAt: new Date().toISOString(),
      });
      await saveCue({ studentId, text, model: modelLabel });
      // Pull the persisted list back from the server so reload-parity holds.
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to generate cue. Check your API key in Settings."
      );
    } finally {
      setLoading(false);
    }
  }

  // Avoid showing the optimistic copy twice once the server list includes it.
  const showFresh =
    fresh && !savedCues.some((c) => c.text === fresh.text);
  const cues = showFresh ? [fresh, ...savedCues] : savedCues;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Personalization cues
        </h2>
        <button
          type="button"
          data-testid="generate-cue"
          onClick={onGenerate}
          disabled={!hasKey || loading}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Generating…" : "Generate Personalization Cue"}
        </button>
      </div>

      {!hasKey && (
        <p
          data-testid="byok-hint"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          Choose a provider and paste your API key in{" "}
          <Link href="/settings" className="font-semibold underline">
            Settings
          </Link>{" "}
          to enable live AI. The roster and score history work without a key.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {cues.length === 0 ? (
        <p className="text-sm text-slate-500">
          No cues yet. {hasKey ? "Generate one to get started." : ""}
        </p>
      ) : (
        <ul className="space-y-3">
          {cues.map((cue) => (
            <li
              key={cue.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p data-testid="cue-text" className="text-sm text-slate-800">
                {cue.text}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {cue.model} ·{" "}
                {new Date(cue.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
