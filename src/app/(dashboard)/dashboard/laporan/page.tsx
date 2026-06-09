import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { LaporanTable } from "./_components/LaporanTable"
import { Suspense } from "react"
import type { Metadata } from "next"
import type { ActivityStatus } from "@prisma/client"

export const metadata: Metadata = { title: "Laporan Aktivitas — SIMDOM" }
export const dynamic = "force-dynamic"

const PAGE_SIZE = 20

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; skpdId?: string; page?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  const search = params.search || ""
  const status = params.status || ""
  const skpdId = params.skpdId || ""
  const page = Math.max(1, parseInt(params.page || "1"))

  const where = {
    ...(search && {
      OR: [
        { jenisKegiatan: { contains: search, mode: "insensitive" as const } },
        { webApp: { nama: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(status && { status: status as ActivityStatus }),
    ...(skpdId && { webApp: { skpdId } }),
  }

  const [laporans, total, webApps, skpds] = await Promise.all([
    prisma.activityReport.findMany({
      where,
      include: {
        webApp: {
          select: { nama: true, url: true, skpd: { select: { nama: true, singkatan: true } } },
        },
      },
      orderBy: { tanggal: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.activityReport.count({ where }),
    prisma.webApp.findMany({
      select: { id: true, nama: true, url: true, skpd: { select: { singkatan: true } } },
      orderBy: [{ skpd: { singkatan: "asc" } }, { nama: "asc" }],
    }),
    prisma.skpd.findMany({
      select: { id: true, singkatan: true },
      orderBy: { singkatan: "asc" },
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Laporan Aktivitas</h1>
        <p className="text-sm text-gray-500">{total} laporan tercatat</p>
      </div>
      <Suspense fallback={<div className="text-sm text-gray-400 py-4">Memuat data...</div>}>
        <LaporanTable
          laporans={laporans}
          webApps={webApps}
          skpds={skpds}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          userRole={session?.user.role ?? "KABID"}
        />
      </Suspense>
    </div>
  )
}