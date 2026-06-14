import { notFound } from "next/navigation";
import { DomainEditForm } from "@/components/domain/domain-edit-form";
import { getDomainById, getRegistrarSuggestions } from "@/lib/domain/domain-service";

export const dynamic = "force-dynamic";

type DomainEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DomainEditPage({ params }: DomainEditPageProps) {
  const { id } = await params;
  const [domain, registrars] = await Promise.all([
    getDomainById(id),
    getRegistrarSuggestions(),
  ]);

  if (!domain) {
    notFound();
  }

  return (
    <main className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Edit domain</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Update registrar, expiry date, or notes for{" "}
          <span className="font-medium text-foreground">{domain.name}</span>.
        </p>
      </div>
      <DomainEditForm domain={domain} registrars={registrars} />
    </main>
  );
}
