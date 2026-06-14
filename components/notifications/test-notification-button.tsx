"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellPlus } from "lucide-react";

export function TestNotificationButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function createTestNotification() {
    setError("");
    setIsSending(true);

    const response = await fetch("/api/notifications/test", { method: "POST" });
    const payload = (await response.json()) as { error?: string };

    setIsSending(false);

    if (!response.ok) {
      setError(payload.error || "Failed to create test notification.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={createTestNotification}
        disabled={isSending}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <BellPlus className="size-4" />
        {isSending ? "Creating..." : "Create test notification"}
      </button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
