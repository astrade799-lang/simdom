import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserTable } from "./_components/UserTable"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Manajemen User — SIMDOM" }
export const revalidate = 30

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

 const [users, skpds] = await Promise.all([
  prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      skpd: { select: { nama: true, singkatan: true } },
    },
  }),
  prisma.skpd.findMany({
    select: { id: true, nama: true, singkatan: true },
    orderBy: { singkatan: "asc" },
  }),
])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Manajemen User</h1>
        <p className="text-sm text-gray-500">{users.length} user terdaftar</p>
      </div>
      <UserTable
        users={users}
        skpds={skpds}
        currentUserId={session.user.id}
      />
    </div>
  )
}