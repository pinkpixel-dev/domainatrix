import { DomainTable } from "@/components/domain/domain-table";
import { getDomainSummaries } from "@/lib/domain/domain-service";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const domains = await getDomainSummaries();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Domains</h1>
      </div>
      <DomainTable domains={domains} />
    </main>
  );
}
