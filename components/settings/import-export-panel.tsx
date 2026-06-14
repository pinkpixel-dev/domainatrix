"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";

export function ImportExportPanel() {
  const router = useRouter();
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState<"json" | "csv" | null>(null);

  async function importJson(file: File) {
    setMessage("");
    setError("");
    setImporting("json");

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
      setImporting(null);
      if (jsonInputRef.current) jsonInputRef.current.value = "";
    }
  }

  async function importCsv(file: File) {
    setMessage("");
    setError("");
    setImporting("csv");

    try {
      const response = await fetch("/api/portfolio/import/csv", {
        method: "POST",
        headers: { "Content-Type": "text/csv; charset=utf-8" },
        body: await file.text(),
      });
      const body = (await response.json()) as {
        result?: { created: number; updated: number };
        error?: string;
      };

      if (!response.ok || !body.result) {
        setError(body.error || "CSV import failed.");
        return;
      }

      setMessage(`Imported ${body.result.created} new and updated ${body.result.updated} existing domains from CSV.`);
      router.refresh();
    } catch {
      setError("Choose a valid Domainatrix CSV export.");
    } finally {
      setImporting(null);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-medium">Import / Export</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Use JSON for full-fidelity backups, or CSV for spreadsheet-friendly domain edits.
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
          <a
            href="/api/portfolio/export/csv"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Download className="size-4" />
            Export CSV
          </a>
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            disabled={importing !== null}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="size-4" />
            {importing === "json" ? "Importing..." : "Import JSON"}
          </button>
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            disabled={importing !== null}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="size-4" />
            {importing === "csv" ? "Importing..." : "Import CSV"}
          </button>
        </div>
      </div>
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importJson(file);
        }}
      />
      <input
        ref={csvInputRef}
        type="file"
        accept="text/csv,.csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importCsv(file);
        }}
      />
      {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
