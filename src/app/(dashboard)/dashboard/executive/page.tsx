import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard Eksekutif — SIMDOM" }
export const revalidate = 60

async function getExecutiveStats() {
  try {
    const [
      totalDomain,
      domainAktif,
      domainTidakAktif,
      domainSuspend,
      totalSkpd,
      laporanPending,
      laporanBulanIni,
      checkTerakhir,
      auditStats,
      domainExpiredSoon,
    ] = await Promise.all([
      // Total domain
      prisma.webApp.count(),

      // Status domain
      prisma.webApp.count({ where: { status: "AKTIF" } }),
      prisma.webApp.count({ where: { status: "TIDAK_AKTIF" } }),
      prisma.webApp.count({ where: { status: "SUSPEND" } }),

      // Total SKPD
      prisma.skpd.count(),

      // Laporan pending
      prisma.activityReport.count({ where: { status: "PENDING" } }),

      // Laporan bulan ini
      prisma.activityReport.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // Check uptime terakhir
      prisma.domainCheck.findMany({
        distinct: ["webAppId"],
        orderBy: { checkedAt: "desc" },
        select: { isOnline: true, webAppId: true, checkedAt: true },
      }),

      // Audit stats
      prisma.technicalAudit.findMany({
        distinct: ["webAppId"],
        orderBy: { checkedAt: "desc" },
        select: {
          performanceGrade: true,
          securityGrade: true,
          dnsGrade: true,
        },
      }),

      // Domain expired dalam 30 hari
      prisma.webApp.count({
        where: {
          tanggalExpired: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    // Hitung uptime dari check terakhir
    const onlineCount = checkTerakhir.filter((c) => c.isOnline).length
    const uptimePct = checkTerakhir.length > 0
      ? Math.round((onlineCount / checkTerakhir.length) * 100)
      : null

    // Hitung audit score rata-rata
    const auditBaik = auditStats.filter(
      (a) => a.performanceGrade === "BAIK" && a.securityGrade === "BAIK"
    ).length
    const auditTotal = auditStats.length

    return {
      totalDomain, domainAktif, domainTidakAktif, domainSuspend,
      totalSkpd, laporanPending, laporanBulanIni,
      onlineCount, uptimePct, checkTotal: checkTerakhir.length,
      auditBaik, auditTotal, domainExpiredSoon,
      error: null,
    }
  } catch (error) {
    console.error("[EXECUTIVE] Error:", error)
    return {
      totalDomain: 0, domainAktif: 0, domainTidakAktif: 0, domainSuspend: 0,
      totalSkpd: 0, laporanPending: 0, laporanBulanIni: 0,
      onlineCount: 0, uptimePct: null, checkTotal: 0,
      auditBaik: 0, auditTotal: 0, domainExpiredSoon: 0,
      error: "Gagal memuat data",
    }
  }
}

export default async function ExecutivePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const stats = await getExecutiveStats()

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Eksekutif</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ringkasan tata kelola layanan digital Kabupaten Soppeng
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400">{today}</p>