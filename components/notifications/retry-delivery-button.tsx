"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

export function RetryDeliveryButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);

  async function retryDelivery() {
    setMessage("");
    setError("");
    setIsRetrying(true);

    const response = await fetch("/api/notifications/retry", { method: "POST" });
    const payload = (await response.json()) as {
      error?: string;
      result?: { checked: number; delivered: number; failed: number };
    };

    setIsRetrying(false);

    if (!response.ok || !payload.result) {
      setError(payload.error || "Failed to retry delivery.");
      return;
    }

    setMessage(
      `${payload.result.checked} checked · ${payload.result.delivered} delivered · ${payload.result.failed} failed`,
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={retryDelivery}
        disabled={isRetrying}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw className="size-4" />
        {isRetrying ? "Retrying..." : "Retry delivery"}
      </button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
