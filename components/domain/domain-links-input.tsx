"use client";

import { Plus, Trash2 } from "lucide-react";
import type { DomainLink } from "@/lib/domain/types";

export type DomainLinkDraft = Pick<DomainLink, "name" | "url" | "description">;

type DomainLinksInputProps = {
  links: DomainLinkDraft[];
  onChange: (links: DomainLinkDraft[]) => void;
};

const emptyLink: DomainLinkDraft = {
  name: "",
  url: "",
  description: "",
};

export function DomainLinksInput({ links, onChange }: DomainLinksInputProps) {
  function updateLink(index: number, field: keyof DomainLinkDraft, value: string) {
    onChange(links.map((link, i) => (i === index ? { ...link, [field]: value } : link)));
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="space-y-4 rounded-md border border-border bg-background/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <legend className="text-sm font-medium">Links</legend>
        <button
          type="button"
          onClick={() => onChange([...links, emptyLink])}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add link
        </button>
      </div>

      {links.length > 0 ? (
        <div className="space-y-3">
          {links.map((link, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-border bg-card/50 p-3 md:grid-cols-[1fr_1.4fr_auto]">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`link-name-${index}`}>
                  Name
                </label>
                <input
                  id={`link-name-${index}`}
                  value={link.name}
                  onChange={(event) => updateLink(index, "name", event.target.value)}
                  placeholder="Homepage"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`link-url-${index}`}>
                  URL
                </label>
                <input
                  id={`link-url-${index}`}
                  value={link.url}
                  onChange={(event) => updateLink(index, "url", event.target.value)}
                  placeholder="https://example.com"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                type="button"
                onClick={() => removeLink(index)}
                className="mt-6 inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Remove link"
              >
                <Trash2 className="size-4" />
              </button>
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`link-description-${index}`}>
                  Description
                </label>
                <input
                  id={`link-description-${index}`}
                  value={link.description}
                  onChange={(event) => updateLink(index, "description", event.target.value)}
                  placeholder="Optional context"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add related URLs like the live site, admin panel, repo, docs, or analytics dashboard.
        </p>
      )}
    </fieldset>
  );
}
