"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

type MarkReadButtonProps = {
  notificationId: string;
};

export function MarkReadButton({ notificationId }: MarkReadButtonProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function markRead() {
    setIsSaving(true);
    await fetch(`/api/notifications/${notificationId}/read`, { method: "POST" });
    setIsSaving(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={markRead}
      disabled={isSaving}
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Check className="size-3.5" />
      {isSaving ? "Saving" : "Mark read"}
    </button>
  );
}
