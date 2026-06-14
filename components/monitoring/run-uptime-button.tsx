"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Activity } from "lucide-react";

type RunUptimeResult = {
  checked: number;
  up: number;
  down: number;
  notificationsCreated: number;
};

export function RunUptimeButton() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function runUptimeChecks() {
    setIsRunning(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/monitoring/uptime/run", { method: "POST" });
      const payload = (await response.json()) as { result?: RunUptimeResult; error?: string };

      if (!response.ok || !payload.result) {
        throw new Error(payload.error || "Failed to run uptime checks.");
      }

      setMessage(
        `${payload.result.checked} checked · ${payload.result.up} up · ${payload.result.down} down · ${payload.result.notificationsCreated} notifications`,
      );
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to run uptime checks.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={runUptimeChecks}
        disabled={isRunning}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Activity className={`size-4 ${isRunning ? "animate-pulse" : ""}`} aria-hidden="true" />
        {isRunning ? "Checking uptime" : "Run uptime"}
      </button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-xs text-amber-400">{error}</p> : null}
    </div>
  );
}
