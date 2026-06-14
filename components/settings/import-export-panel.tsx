"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";

export function ImportExportPanel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  async function importFile(file: File) {
    setMessage("");
    setError("");
    setIsImporting(true);

    try {
      const payload = JSON.parse(await file.text()) as unknown;
      const response = await fetch("/api/portfolio/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        result?: { created: number; updated: number };
        error?: string;
      };

      if (!response.ok || !body.result) {
        setError(body.error || "Import failed.");
        return;
      }

      setMessage(`Imported ${body.result.created} new and updated ${body.result.updated} existing domains.`);
      router.refresh();
    } catch {
      setError("Choose a valid Domainatrix JSON export.");
    } finally {
      setIsImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-medium">Import / Export</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Export your portfolio as JSON, or import a previous Domainatrix export.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/portfolio/export"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Download className="size-4" />
            Export JSON
          </a>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="size-4" />
            {isImporting ? "Importing..." : "Import JSON"}
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importFile(file);
        }}
      />
      {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
