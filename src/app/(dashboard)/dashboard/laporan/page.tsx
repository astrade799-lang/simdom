import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { LaporanTable } from "./_components/LaporanTable"
import { Suspense } from "react"
import type { Metadata } from "next"
import type { ActivityStatus } from "@prisma/client"

export const metadata: Metadata = { title: "Laporan Aktivitas — SIMDOM" }
export const dynamic = "force-dynamic"

const PAGE_SIZE = 20

function buildDateRange(preset: string, dateFrom: string, dateTo: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (preset === "today") {
    return { gte: today, lte: new Date(today.getTime() + 86400000 - 1) }
  }
  if (preset === "week") {
    const from = new Date(today.getTime() - 6 * 86400000)
    return { gte: from, lte: new Date(today.getTime() + 86400000 - 1) }
  }
  if (preset === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    return { gte: from, lte: to }
  }
  if (preset === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    return { gte: from, lte: to }
  }
  if (dateFrom || dateTo) {
    return {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo + "T23:59:59") }),
    }
  }
  return undefined
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string; status?: string; skpdId?: string
    page?: string; preset?: string; dateFrom?: string; dateTo?: string
  }>
}) {
  const session = await auth()
  const params = await searchParams

  const search = params.search || ""
  const status = params.status || ""
  const skpdId = params.skpdId || ""
  const page = Math.max(1, parseInt(params.page || "1"))
  const preset = params.preset || ""
  const dateFrom = params.dateFrom || ""
  const dateTo = params.dateTo || ""

  const dateRange = buildDateRange(preset, dateFrom, dateTo)

  const where = {
    ...(search && {
      OR: [
        { jenisKegiatan: { contains: search, mode: "insensitive" as const } },
        { webApp: { nama: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(status && { status: status as ActivityStatus }),
    ...(skpdId && { webApp: { skpdId } }),
    ...(dateRange && { tanggal: dateRange }),
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
        <h1 className="text-xl font-bold text-slate-900">Laporan Aktivitas</h1>
        <p className="text-sm text-slate-500">{total} laporan tercatat</p>
      </div>
      <Suspense fallback={<div className="text-sm text-slate-400 py-4">Memuat data...</div>}>
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