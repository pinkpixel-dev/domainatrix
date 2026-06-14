"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

type RunChecksResult = {
  checked: number;
  changed: number;
  notificationsCreated: number;
  errors: Array<{ message: string }>;
};

export function RunChecksButton() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function runChecks() {
    setIsRunning(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/monitoring/checks/run", { method: "POST" });
      const payload = (await response.json()) as { result?: RunChecksResult; error?: string };

      if (!response.ok || !payload.result) {
        throw new Error(payload.error || "Failed to run checks.");
      }

      setMessage(
        `${payload.result.checked} checked · ${payload.result.changed} changed · ${payload.result.notificationsCreated} notifications`,
      );

      if (payload.result.errors.length > 0) {
        setError(`${payload.result.errors.length} lookup issue${payload.result.errors.length === 1 ? "" : "s"} reported.`);
      }

      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to run checks.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={runChecks}
        disabled={isRunning}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`size-4 ${isRunning ? "animate-spin" : ""}`} aria-hidden="true" />
        {isRunning ? "Running checks" : "Run checks"}
      </button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-xs text-amber-400">{error}</p> : null}
    </div>
  );
}
