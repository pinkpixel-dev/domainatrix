"use client";

import { Gauge, KeyRound, Eye, EyeOff, ExternalLink, Lock } from "lucide-react";
import { useState } from "react";

type CruxSettingsPanelProps = {
  settings: Record<string, string>;
  onSave: (updates: Record<string, string>) => Promise<void>;
};

export function CruxSettingsPanel({ settings, onSave }: CruxSettingsPanelProps) {
  const [cruxKey, setCruxKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isConfigured = Boolean(settings.CRUX_API_KEY && settings.CRUX_API_KEY !== "");
  const hasKey = isConfigured;

  async function handleSave() {
    if (!cruxKey.trim()) return;
    setIsSaving(true);
    try {
      await onSave({ CRUX_API_KEY: cruxKey.trim() });
      setCruxKey("");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    setIsSaving(true);
    try {
      await onSave({ CRUX_API_KEY: "" });
      setCruxKey("");
    } finally {
      setIsSaving(false);
    }
  }

  const isEditing = cruxKey !== "";
  const saveDisabled = isSaving || !isEditing;

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-medium">Chrome UX Report (CrUX) integration</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Pull real-world user experience data (Core Web Vitals) for your domain portfolio directly from Google.
          </p>
        </div>
        <span
          className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium ${
            hasKey
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-border bg-muted/20 text-muted-foreground"
          }`}
        >
          <Gauge className="size-3.5" />
          {hasKey ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="crux-key" className="text-xs font-medium text-muted-foreground">
            CRUX_API_KEY
          </label>
          <div className="flex max-w-xl gap-2">
            <div className="relative flex-1">
              <input
                id="crux-key"
                type={showKey ? "text" : "password"}
                value={cruxKey}
                onChange={(e) => setCruxKey(e.target.value)}
                placeholder={isConfigured ? "•••••••• (Key Saved)" : "Enter Google Cloud API Key"}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 pr-10 text-sm focus:border-primary focus:outline-none text-foreground placeholder-muted-foreground/50 text-ellipsis"
              />
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              ) : isConfigured ? (
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                  title="Key is saved and hidden for security"
                >
                  <Lock className="size-4" />
                </div>
              ) : null}
            </div>
            {isConfigured && !isEditing && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 px-3 text-sm font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-50 cursor-pointer"
              >
                Clear Key
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled}
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="rounded-md border border-border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
          <p>
            To fetch Core Web Vitals, you need a Google Cloud API Key with the **Chrome UX Report API** enabled:
          </p>
          <ol className="mt-2 list-decimal pl-5 space-y-1">
            <li>
              Go to the{" "}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Google Cloud Console <ExternalLink className="size-3" />
              </a>{" "}
              or Google AI Studio.
            </li>
            <li>Create or select a project and search for the **Chrome UX Report API** in the library.</li>
            <li>Enable the API, go to **Credentials**, and generate an API key.</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
