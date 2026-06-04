"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BYOK_STORAGE_KEY, type Provider } from "@/lib/types";

const PROVIDERS: {
  value: Provider;
  label: string;
  keyLabel: string;
  models: string[];
}[] = [
  {
    value: "anthropic",
    label: "Anthropic",
    keyLabel: "Anthropic",
    models: ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-7"],
  },
  {
    value: "openai",
    label: "OpenAI",
    keyLabel: "OpenAI",
    models: ["gpt-4o-mini", "gpt-4o", "o1-mini"],
  },
  {
    value: "google",
    label: "Google",
    keyLabel: "Google",
    models: ["gemini-2.0-flash", "gemini-2.5-pro"],
  },
];

function providerConfig(value: Provider) {
  return PROVIDERS.find((p) => p.value === value) ?? PROVIDERS[0];
}

export default function SettingsPage() {
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(PROVIDERS[0].models[0]);
  const [saved, setSaved] = useState(false);

  // Hydrate from any previously saved config.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BYOK_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.provider && parsed.provider !== "mock") {
        setProvider(parsed.provider);
        setApiKey(parsed.apiKey ?? "");
        setModel(parsed.model ?? providerConfig(parsed.provider).models[0]);
      }
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const config = providerConfig(provider);

  function onProviderChange(value: Provider) {
    setProvider(value);
    setModel(providerConfig(value).models[0]);
    setSaved(false);
  }

  function onSave() {
    window.localStorage.setItem(
      BYOK_STORAGE_KEY,
      JSON.stringify({ provider, apiKey, model })
    );
    setSaved(true);
  }

  function onClear() {
    window.localStorage.removeItem(BYOK_STORAGE_KEY);
    setApiKey("");
    setProvider("anthropic");
    setModel(PROVIDERS[0].models[0]);
    setSaved(false);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/" className="text-sm text-brand hover:underline">
          ← Back to roster
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          AI provider settings
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Bring your own key. Your key is stored only in this browser&apos;s
          localStorage and used to call the provider directly — it never touches
          our server and bills only your account.
        </p>
      </div>

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Provider
          </span>
          <select
            data-testid="provider-select"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as Provider)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            {config.keyLabel} API key
          </span>
          <input
            data-testid="apikey-input"
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setSaved(false);
            }}
            placeholder={`${config.keyLabel} API key`}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Model
          </span>
          <select
            data-testid="model-select"
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setSaved(false);
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {config.models.map((m, i) => (
              <option key={m} value={m}>
                {m}
                {i === 0 ? " (default)" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            data-testid="save-byok"
            onClick={onSave}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Save
          </button>
          <button
            type="button"
            data-testid="clear-byok"
            onClick={onClear}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
          >
            Clear
          </button>
          {saved && (
            <span className="text-sm font-medium text-emerald-600">
              Saved ✓
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        No key handy? Behavioral tests and demos can use a built-in mock
        provider that returns deterministic cues offline.
      </p>
    </div>
  );
}
