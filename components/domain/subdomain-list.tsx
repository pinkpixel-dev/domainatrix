import { Globe, ScanSearch } from "lucide-react";
import type { SubdomainSummary } from "@/lib/domain/domain-repository";

type SubdomainListProps = {
  subdomains: SubdomainSummary[];
};

export function SubdomainList({ subdomains }: SubdomainListProps) {
  const resolved = subdomains.filter((s) => s.resolved);
  const unresolved = subdomains.filter((s) => !s.resolved);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <ScanSearch className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-medium">Subdomains</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {resolved.length} live · {unresolved.length} unresolved
        </span>
      </div>

      {subdomains.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <Globe className="size-6 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No subdomains discovered yet.</p>
          <p className="text-xs text-muted-foreground/60">
            Click <span className="font-medium text-foreground">Discover</span> to query Certificate
            Transparency logs and common DNS names.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {resolved.length > 0 && (
            <>
              <p className="px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
                Live ({resolved.length})
              </p>
              {resolved.map((sub) => (
                <SubdomainRow key={sub.id} sub={sub} />
              ))}
            </>
          )}
          {unresolved.length > 0 && (
            <>
              <p className="px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
                Unresolved ({unresolved.length})
              </p>
              {unresolved.map((sub) => (
                <SubdomainRow key={sub.id} sub={sub} />
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function SubdomainRow({ sub }: { sub: SubdomainSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
      {/* Name + live indicator */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className="inline-block size-1.5 shrink-0 rounded-full"
          style={{ background: sub.resolved ? "#34d399" : "#4b5563" }}
          aria-label={sub.resolved ? "Live" : "Unresolved"}
        />
        <span className="truncate font-mono text-xs">{sub.name}</span>
      </div>

      {/* IPs */}
      {sub.ipAddresses.length > 0 && (
        <span className="hidden text-[11px] text-muted-foreground/70 sm:block">
          {sub.ipAddresses.slice(0, 2).join(", ")}
          {sub.ipAddresses.length > 2 && ` +${sub.ipAddresses.length - 2}`}
        </span>
      )}

    </div>
  );
}
