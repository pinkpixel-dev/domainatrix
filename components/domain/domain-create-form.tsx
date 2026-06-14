"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeDomainName, validateDomainName } from "@/lib/domain/domain-utils";
import Link from "next/link";
import { TagInput } from "@/components/domain/tag-input";
import { NotificationPreferencesInput } from "@/components/domain/notification-preferences-input";
import { defaultNotificationPreferences } from "@/lib/domain/notification-preferences";
import type { RegistrarSuggestion } from "@/lib/domain/types";
import { DomainLinksInput, type DomainLinkDraft } from "@/components/domain/domain-links-input";

type DomainCreateFormProps = {
  registrars: RegistrarSuggestion[];
};

export function DomainCreateForm({ registrars }: DomainCreateFormProps) {
  const router = useRouter();
  const [domainName, setDomainName] = useState("");
  const [registrarName, setRegistrarName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [links, setLinks] = useState<DomainLinkDraft[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState(defaultNotificationPreferences);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [renewalCost, setRenewalCost] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [error, setError] = useState("");
  const [conflictId, setConflictId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const normalized = normalizeDomainName(domainName);
  const validation = validateDomainName(domainName);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setConflictId(null);

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsSaving(true);

    const response = await fetch("/api/domains", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domainName,
        registrarName,
        expiryDate,
        notes,
        tags,
        links: cleanedLinks(links),
        notificationPreferences,
        costings: {
          purchasePrice: toMoneyValue(purchasePrice),
          renewalCost: toMoneyValue(renewalCost),
          currentValue: toMoneyValue(currentValue),
          autoRenew,
        },
      }),
    });

    const payload = (await response.json()) as {
      domain?: { id: string };
      error?: string;
      existingId?: string;
    };

    setIsSaving(false);

    if (response.status === 409 && payload.existingId) {
      setConflictId(payload.existingId);
      return;
    }

    if (!response.ok || !payload.domain) {
      setError(payload.error || "Failed to save domain.");
      return;
    }

    router.push(`/domains/${payload.domain.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-card p-5">
      <div className="space-y-2">
        <label htmlFor="domain-name" className="text-sm font-medium">
          Domain name
        </label>
        <input
          id="domain-name"
          name="domain-name"
          value={domainName}
          onChange={(event) => {
            setDomainName(event.target.value);
            setConflictId(null);
            setError("");
          }}
          placeholder="pinkpixel.dev"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p className={validation.valid ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
          {domainName.length === 0
            ? "Enter a root domain to start the enrichment flow."
            : validation.valid
              ? `Ready to save as ${normalized}.`
              : validation.error}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="registrar" className="text-sm font-medium">
            Registrar
          </label>
          <input
            id="registrar"
            name="registrar"
            list="registrar-suggestions"
            value={registrarName}
            onChange={(event) => setRegistrarName(event.target.value)}
            placeholder="Namecheap"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <datalist id="registrar-suggestions">
            {registrars.map((registrar) => (
              <option
                key={registrar.id}
                value={registrar.name}
                label={`${registrar.domainCount} domain${registrar.domainCount === 1 ? "" : "s"}`}
              />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <label htmlFor="expiry" className="text-sm font-medium">
            Expiry date
          </label>
          <input
            id="expiry"
            name="expiry"
            type="date"
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="What is this domain for?"
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <TagInput tags={tags} onChange={setTags} />
        <p className="text-xs text-muted-foreground">Press Enter or comma to add. Click × to remove.</p>
      </div>

      <DomainLinksInput links={links} onChange={setLinks} />

      <fieldset className="space-y-4 rounded-md border border-border bg-background/40 p-4">
        <legend className="px-1 text-sm font-medium">Costings</legend>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="purchase-price" className="text-sm font-medium">
              Purchase price
            </label>
            <input
              id="purchase-price"
              name="purchase-price"
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(event) => setPurchasePrice(event.target.value)}
              placeholder="12.99"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="renewal-cost" className="text-sm font-medium">
              Renewal cost
            </label>
            <input
              id="renewal-cost"
              name="renewal-cost"
              type="number"
              min="0"
              step="0.01"
              value={renewalCost}
              onChange={(event) => setRenewalCost(event.target.value)}
              placeholder="18.99"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="current-value" className="text-sm font-medium">
              Current value
            </label>
            <input
              id="current-value"
              name="current-value"
              type="number"
              min="0"
              step="0.01"
              value={currentValue}
              onChange={(event) => setCurrentValue(event.target.value)}
              placeholder="250"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={(event) => setAutoRenew(event.target.checked)}
            className="size-4 rounded border-input accent-primary"
          />
          Auto-renew is enabled
        </label>
      </fieldset>

      <NotificationPreferencesInput
        preferences={notificationPreferences}
        onChange={setNotificationPreferences}
      />

      {conflictId ? (
        <div className="flex items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <span className="text-amber-400">This domain is already in your portfolio.</span>
          <Link
            href={`/domains/${conflictId}`}
            className="ml-auto shrink-0 font-medium text-amber-300 underline underline-offset-2 hover:text-amber-200"
          >
            View it →
          </Link>
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={!validation.valid || isSaving}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save draft"}
      </button>
    </form>
  );
}

function toMoneyValue(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cleanedLinks(links: DomainLinkDraft[]) {
  return links
    .map((link) => ({
      name: link.name.trim(),
      url: link.url.trim(),
      description: link.description.trim(),
    }))
    .filter((link) => link.name && link.url);
}
