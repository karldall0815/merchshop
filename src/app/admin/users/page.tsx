import { listUsers } from "@/modules/admin/users";
import { UserRow } from "@/components/admin/UserRow";
import { NewUserForm } from "@/components/admin/NewUserForm";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await listUsers();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Benutzer</h1>
        <p className="text-sm text-muted-foreground">
          Rollen ändern, deaktivieren, Passwort zurücksetzen.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 font-medium">Neuer Benutzer</h2>
        <NewUserForm />
      </section>

      <section className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">E-Mail</th>
              <th className="px-4 py-3 text-left font-medium">Rolle</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Default-Kostenstelle</th>
              <th className="px-4 py-3 text-left font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
