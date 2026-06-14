"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

type DomainEnrichButtonProps = {
  domainId: string;
};

export function DomainEnrichButton({ domainId }: DomainEnrichButtonProps) {
  const router = useRouter();
  const [isEnriching, setIsEnriching] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function handleEnrich() {
    setIsEnriching(true);
    setWarnings([]);
    setError("");

    const response = await fetch(`/api/domains/${domainId}/enrich`, {
      method: "POST",
    });

    const payload = (await response.json()) as {
      domain?: unknown;
      errors?: string[];
      error?: string;
    };

    setIsEnriching(false);

    if (!response.ok) {
      setError(payload.error || "Enrichment failed.");
      return;
    }

    if (payload.errors && payload.errors.length > 0) {
      setWarnings(payload.errors);
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleEnrich}
        disabled={isEnriching}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {isEnriching ? "Enriching…" : "Enrich"}
      </button>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : warnings.length > 0 ? (
        <ul className="space-y-0.5 text-right text-xs text-amber-400">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
