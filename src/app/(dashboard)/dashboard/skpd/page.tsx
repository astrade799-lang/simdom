import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SkpdTable } from "./_components/SkpdTable"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Data SKPD — SIMDOM" }
export const revalidate = 60  // SKPD jarang berubah, cache lebih lama

export default async function SkpdPage() {
  // ✅ auth dulu, baru query — SKPD page tidak ada searchParams
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard")

  const skpds = await prisma.skpd.findMany({
  orderBy: { nama: "asc" },
  include: { _count: { select: { webApps: true } } },
})

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Data SKPD</h1>
        <p className="text-sm text-gray-500">{skpds.length} SKPD terdaftar</p>
      </div>
      <SkpdTable skpds={skpds} />
    </div>
  )
}