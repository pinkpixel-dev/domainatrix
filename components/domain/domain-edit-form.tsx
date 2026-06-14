"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DomainSummary, RegistrarSuggestion } from "@/lib/domain/types";
import { TagInput } from "@/components/domain/tag-input";
import { NotificationPreferencesInput } from "@/components/domain/notification-preferences-input";
import { defaultNotificationPreferences, normalizeNotificationPreferences } from "@/lib/domain/notification-preferences";
import { DomainLinksInput, type DomainLinkDraft } from "@/components/domain/domain-links-input";

type DomainEditFormProps = {
  domain: DomainSummary;
  registrars: RegistrarSuggestion[];
};

export function DomainEditForm({ domain, registrars }: DomainEditFormProps) {
  const router = useRouter();
  const [registrarName, setRegistrarName] = useState(
    domain.registrar.name === "Unknown" ? "" : domain.registrar.name,
  );
  const [expiryDate, setExpiryDate] = useState(
    domain.expiryDate === "Untracked" ? "" : domain.expiryDate,
  );
  const [notes, setNotes] = useState(domain.notes);
  const [tags, setTags] = useState<string[]>(domain.tags);
  const [links, setLinks] = useState<DomainLinkDraft[]>(domain.links);
  const [notificationPreferences, setNotificationPreferences] = useState(
    domain.notificationPreferences.length > 0
      ? normalizeNotificationPreferences(domain.notificationPreferences)
      : defaultNotificationPreferences,
  );
  const [purchasePrice, setPurchasePrice] = useState(formatMoneyInput(domain.costings.purchasePrice));
  const [renewalCost, setRenewalCost] = useState(formatMoneyInput(domain.costings.renewalCost));
  const [currentValue, setCurrentValue] = useState(formatMoneyInput(domain.costings.currentValue));
  const [autoRenew, setAutoRenew] = useState(domain.costings.autoRenew);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const response = await fetch(`/api/domains/${domain.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrarName: registrarName.trim() || undefined,
        expiryDate: expiryDate || undefined,
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
    };

    setIsSaving(false);

    if (!response.ok) {
      setError(payload.error || "Failed to update domain.");
      return;
    }

    router.push(`/domains/${domain.id}`);
    router.refresh();
  }

  function handleCancel() {
    router.push(`/domains/${domain.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-card p-5">
      {/* Domain name — read only, shown for context */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Domain name</p>
        <p className="text-base font-semibold">{domain.name}</p>
        <p className="text-xs text-muted-foreground">Domain names cannot be changed after creation.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="edit-registrar" className="text-sm font-medium">
            Registrar
          </label>
          <input
            id="edit-registrar"
            name="registrar"
            list="edit-registrar-suggestions"
            value={registrarName}
            onChange={(event) => setRegistrarName(event.target.value)}
            placeholder="Namecheap"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <datalist id="edit-registrar-suggestions">
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
          <label htmlFor="edit-expiry" className="text-sm font-medium">
            Expiry date
          </label>
          <input
            id="edit-expiry"
            name="expiry"
            type="date"
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="edit-notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="edit-notes"
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
            <label htmlFor="edit-purchase-price" className="text-sm font-medium">
              Purchase price
            </label>
            <input
              id="edit-purchase-price"
              name="purchase-price"
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(event) => setPurchasePrice(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-renewal-cost" className="text-sm font-medium">
              Renewal cost
            </label>
            <input
              id="edit-renewal-cost"
              name="renewal-cost"
              type="number"
              min="0"
              step="0.01"
              value={renewalCost}
              onChange={(event) => setRenewalCost(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-current-value" className="text-sm font-medium">
              Current value
            </label>
            <input
              id="edit-current-value"
              name="current-value"
              type="number"
              min="0"
              step="0.01"
              value={currentValue}
              onChange={(event) => setCurrentValue(event.target.value)}
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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function toMoneyValue(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoneyInput(value: number) {
  return value > 0 ? String(value) : "";
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
