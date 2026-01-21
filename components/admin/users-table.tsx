"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  UserCog, 
  Trash2, 
  Shield,
  User,
  RefreshCw,
  Loader2
} from "lucide-react"

interface UserData {
  id: string
  email: string
  company_name: string
  responsible_name: string
  role: "ADMIN" | "USER"
  status: "PENDING" | "APPROVED" | "SUSPENDED"
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function UsersTable() {
  const { data, error, isLoading } = useSWR<{ users: UserData[] }>("/api/admin/users", fetcher)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: UserData | null }>({
    open: false,
    user: null,
  })

  async function handleAction(userId: string, action: string, role?: string) {
    setActionLoading(userId)
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, role }),
      })

      if (response.ok) {
        mutate("/api/admin/users")
      }
    } catch (error) {
      console.error("Action error:", error)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete() {
    if (!deleteDialog.user) return

    setActionLoading(deleteDialog.user.id)
    try {
      const response = await fetch(`/api/admin/users?userId=${deleteDialog.user.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        mutate("/api/admin/users")
      }
    } catch (error) {
      console.error("Delete error:", error)
    } finally {
      setActionLoading(null)
      setDeleteDialog({ open: false, user: null })
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovado</Badge>
      case "SUSPENDED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Suspenso</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-primary/10 text-primary border-primary/20"><Shield className="w-3 h-3 mr-1" />Admin</Badge>
      case "USER":
        return <Badge variant="secondary"><User className="w-3 h-3 mr-1" />Usuário</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Erro ao carregar usuários
      </div>
    )
  }

  const users = data?.users || []

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum usuário encontrado
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Responsavel</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.company_name}</TableCell>
                <TableCell>{user.responsible_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                        <span className="sr-only">Ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.status === "PENDING" && (
                        <DropdownMenuItem onClick={() => handleAction(user.id, "approve")}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                          Aprovar
                        </DropdownMenuItem>
                      )}
                      {user.status === "APPROVED" && (
                        <DropdownMenuItem onClick={() => handleAction(user.id, "suspend")}>
                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                          Suspender
                        </DropdownMenuItem>
                      )}
                      {user.status === "SUSPENDED" && (
                        <DropdownMenuItem onClick={() => handleAction(user.id, "reactivate")}>
                          <RefreshCw className="mr-2 h-4 w-4 text-green-600" />
                          Reativar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {user.role === "USER" && (
                        <DropdownMenuItem onClick={() => handleAction(user.id, "change_role", "ADMIN")}>
                          <Shield className="mr-2 h-4 w-4" />
                          Tornar Admin
                        </DropdownMenuItem>
                      )}
                      {user.role === "ADMIN" && (
                        <DropdownMenuItem onClick={() => handleAction(user.id, "change_role", "USER")}>
                          <User className="mr-2 h-4 w-4" />
                          Tornar Usuário
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteDialog({ open: true, user })}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: open ? deleteDialog.user : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuario <strong>{deleteDialog.user?.company_name}</strong> ({deleteDialog.user?.email})?
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
