import { AdminStats } from "@/components/admin/admin-stats"
import { UsersTable } from "@/components/admin/users-table"

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as contas de usuários e aprovações
        </p>
      </div>

      <AdminStats />

      <div>
        <h2 className="text-xl font-semibold mb-4">Todos os Usuários</h2>
        <UsersTable />
      </div>
    </div>
  )
}
