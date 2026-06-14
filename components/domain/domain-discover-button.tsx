"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanSearch } from "lucide-react";

type DomainDiscoverButtonProps = {
  domainId: string;
};

export function DomainDiscoverButton({ domainId }: DomainDiscoverButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [count, setCount] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function handleDiscover() {
    setState("running");
    setWarnings([]);
    setError("");
    setCount(null);

    const response = await fetch(`/api/domains/${domainId}/subdomains`, {
      method: "POST",
    });

    const payload = (await response.json()) as {
      subdomains?: { name: string }[];
      errors?: string[];
      error?: string;
    };

    if (!response.ok) {
      setError(payload.error || "Discovery failed.");
      setState("idle");
      return;
    }

    setCount(payload.subdomains?.length ?? 0);
    if (payload.errors && payload.errors.length > 0) {
      setWarnings(payload.errors);
    }

    setState("done");
    router.refresh();
  }

  const label =
    state === "running"
      ? "Discovering…"
      : state === "done" && count !== null
        ? `Found ${count}`
        : "Discover";

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleDiscover}
        disabled={state === "running"}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ScanSearch className="h-3.5 w-3.5" />
        {label}
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
