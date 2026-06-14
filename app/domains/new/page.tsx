import { DomainCreateForm } from "@/components/domain/domain-create-form";
import { getRegistrarSuggestions } from "@/lib/domain/domain-service";

export const dynamic = "force-dynamic";

export default async function NewDomainPage() {
  const registrars = await getRegistrarSuggestions();

  return (
    <main className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Add a domain</h1>
      </div>
      <DomainCreateForm registrars={registrars} />
    </main>
  );
}
