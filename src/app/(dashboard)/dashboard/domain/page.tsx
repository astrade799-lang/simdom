import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { DomainTable } from "./_components/DomainTable"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import type { Metadata } from "next"
import type { WebStatus } from "@prisma/client"

export const metadata: Metadata = { title: "Domain & Subdomain — SIMDOM" }
export const revalidate = 30  // ← ganti force-dynamic

const PAGE_SIZE = 20

export default async function DomainPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; skpdId?: string; page?: string }>
}) {
  // ✅ Jalankan auth + searchParams PARALEL
  const [session, params] = await Promise.all([
    auth(),
    searchParams,
  ])

  // ✅ Security check
  if (!session?.user) redirect("/login")

  const search = params.search ?? ""
  const status = params.status ?? ""
  const skpdId = params.skpdId ?? ""
  const page = Math.max(1, parseInt(params.page ?? "1"))

  const where = {
    ...(search && {
      OR: [
        { nama: { contains: search, mode: "insensitive" as const } },
        { url: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(status && { status: status as WebStatus }),
    ...(skpdId && { skpdId }),
  }

  // ✅ Semua query paralel + select lebih spesifik
  const [webApps, total, skpds] = await Promise.all([
    prisma.webApp.findMany({
      where,
      select: {
        id: true,
        nama: true,
        url: true,
        status: true,
        keterangan: true,
        skpdId: true,
        skpd: { select: { nama: true, singkatan: true } },
      },
      orderBy: [{ skpd: { singkatan: "asc" } }, { nama: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.webApp.count({ where }),
    prisma.skpd.findMany({
      select: { id: true, nama: true, singkatan: true },
      orderBy: { singkatan: "asc" },  // singkatan lebih cepat dari nama
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Domain & Subdomain</h1>
        <p className="text-sm text-gray-500">{total} domain terdaftar</p>
      </div>
      <Suspense fallback={<div className="text-sm text-gray-400 py-4">Memuat data...</div>}>
        <DomainTable
          webApps={webApps}
          skpds={skpds}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          userRole={session.user.role ?? "KABID"}
        />
      </Suspense>
    </div>
  )
}