"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Clock, UserX } from "lucide-react"

interface UserData {
  id: string
  status: "PENDING" | "APPROVED" | "SUSPENDED"
  role: "ADMIN" | "USER"
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminStats() {
  const { data } = useSWR<{ users: UserData[] }>("/api/admin/users", fetcher)

  const users = data?.users || []
  const totalUsers = users.length
  const pendingUsers = users.filter((u) => u.status === "PENDING").length
  const approvedUsers = users.filter((u) => u.status === "APPROVED").length
  const suspendedUsers = users.filter((u) => u.status === "SUSPENDED").length

  const stats = [
    {
      title: "Total de Usuários",
      value: totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pendentes",
      value: pendingUsers,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Aprovados",
      value: approvedUsers,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Suspensos",
      value: suspendedUsers,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
