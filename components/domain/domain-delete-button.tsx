"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DomainDeleteButtonProps = {
  domainId: string;
  domainName: string;
};

export function DomainDeleteButton({ domainId, domainName }: DomainDeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setIsDeleting(true);
    setError("");

    const response = await fetch(`/api/domains/${domainId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error || "Failed to delete domain.");
      setIsDeleting(false);
      setConfirming(false);
      return;
    }

    router.push("/domains");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <span className="text-sm text-muted-foreground">Delete {domainName}?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex h-8 items-center justify-center rounded-md bg-destructive px-3 text-xs font-medium text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isDeleting}
          className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex h-9 items-center justify-center rounded-md border border-destructive/40 px-4 text-sm font-medium text-destructive transition hover:bg-destructive/10"
    >
      Delete
    </button>
  );
}
