import { listUsers } from "@/modules/admin/users";
import { getCostCenters } from "@/modules/admin/general-settings";
import { UserRow } from "@/components/admin/UserRow";
import { UserForm } from "@/components/admin/UserForm";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, costCenters] = await Promise.all([listUsers(), getCostCenters()]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Benutzer</h1>
        <p className="text-sm text-muted-foreground">
          Anlage und Bearbeitung. Detail-Felder werden im Bearbeiten-Dialog gepflegt.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 font-medium">Neuer Benutzer</h2>
        <UserForm mode="create" costCenters={costCenters} />
      </section>

      <section className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <UserRow key={u.id} user={u} costCenters={costCenters} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
