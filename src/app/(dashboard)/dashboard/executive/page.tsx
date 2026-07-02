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
          <p className="text-xs text-slate-400 mt-0.5">Diskominfo Kabupaten Soppeng</p>
        </div>
      </div>

      {stats.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {stats.error}
        </div>
      )}

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Domain */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-lg shadow-blue-200">
          <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total Domain</p>
          <p className="text-4xl font-bold mt-2">{stats.totalDomain}</p>
          <p className="text-xs text-blue-200 mt-1">{stats.totalSkpd} SKPD</p>
        </div>

        {/* Domain Aktif */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-200">
          <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Domain Aktif</p>
          <p className="text-4xl font-bold mt-2">{stats.domainAktif}</p>
          <p className="text-xs text-emerald-100 mt-1">
            {stats.totalDomain > 0
              ? `${Math.round((stats.domainAktif / stats.totalDomain) * 100)}% dari total`
              : "—"}
          </p>
        </div>

        {/* Uptime */}
        <div className={`rounded-2xl p-5 text-white shadow-lg ${
          stats.uptimePct === null ? "bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-200"
          : stats.uptimePct >= 80 ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-200"
          : stats.uptimePct >= 50 ? "bg-gradient-to-br from-yellow-500 to-orange-500 shadow-yellow-200"
          : "bg-gradient-to-br from-red-500 to-red-600 shadow-red-200"
        }`}>
          <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">% Online</p>
          <p className="text-4xl font-bold mt-2">
            {stats.uptimePct !== null ? `${stats.uptimePct}%` : "—"}
          </p>
          <p className="text-xs text-white/70 mt-1">
            {stats.checkTotal > 0
              ? `${stats.onlineCount}/${stats.checkTotal} domain`
              : "Belum ada data monitoring"}
          </p>
        </div>

        {/* Laporan Pending */}
        <div className={`rounded-2xl p-5 text-white shadow-lg ${
          stats.laporanPending > 0
            ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200"
            : "bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-200"
        }`}>
          <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">Laporan Pending</p>
          <p className="text-4xl font-bold mt-2">{stats.laporanPending}</p>
          <p className="text-xs text-white/70 mt-1">
            {stats.laporanPending > 0 ? "Perlu tindakan" : "Semua selesai"}
          </p>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Status Domain */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Status Domain</h3>
          <p className="text-xs text-slate-400 mb-4">Kondisi seluruh layanan digital</p>
          <div className="space-y-3">
            {[
              { label: "Aktif", count: stats.domainAktif, color: "bg-emerald-500", text: "text-emerald-700" },
              { label: "Tidak Aktif", count: stats.domainTidakAktif, color: "bg-slate-300", text: "text-slate-500" },
              { label: "Suspend", count: stats.domainSuspend, color: "bg-red-500", text: "text-red-600" },
            ].map((item) => {
              const pct = stats.totalDomain > 0
                ? Math.round((item.count / stats.totalDomain) * 100) : 0
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${item.color}`} />
                      <span className="text-xs font-medium text-slate-700">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${item.text}`}>{item.count}</span>
                      <span className="text-[10px] text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Audit Summary */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Hasil Audit Teknis</h3>
          <p className="text-xs text-slate-400 mb-4">
            {stats.auditTotal > 0
              ? `${stats.auditTotal} domain sudah diaudit`
              : "Belum ada audit dilakukan"}
          </p>

          {stats.auditTotal > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Domain teraudit</span>
                <span className="text-xs font-bold text-slate-800">{stats.auditTotal} / {stats.totalDomain}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${Math.round((stats.auditTotal / stats.totalDomain) * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Performa & Keamanan Baik</span>
                <span className="text-xs font-bold text-green-700">{stats.auditBaik} domain</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-green-500"
                  style={{ width: stats.auditTotal > 0 ? `${Math.round((stats.auditBaik / stats.auditTotal) * 100)}%` : "0%" }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <svg className="h-8 w-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-xs text-slate-400">Mulai audit domain melalui menu<br/>Domain & Subdomain</p>
            </div>
          )}
        </div>

        {/* Perhatian */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Perlu Perhatian</h3>
          <p className="text-xs text-slate-400 mb-4">Item yang membutuhkan tindakan</p>
          <div className="space-y-2.5">

            {/* Laporan pending */}
            <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
              stats.laporanPending > 0 ? "bg-amber-50" : "bg-slate-50"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${stats.laporanPending > 0 ? "bg-amber-500" : "bg-slate-300"}`} />
                <span className="text-xs text-slate-700">Laporan pending</span>
              </div>
              <span className={`text-sm font-bold ${stats.laporanPending > 0 ? "text-amber-600" : "text-slate-400"}`}>
                {stats.laporanPending}
              </span>
            </div>

            {/* Domain tidak aktif */}
            <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
              stats.domainTidakAktif > 0 ? "bg-slate-50" : "bg-slate-50"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${stats.domainTidakAktif > 0 ? "bg-slate-400" : "bg-slate-300"}`} />
                <span className="text-xs text-slate-700">Domain tidak aktif</span>
              </div>
              <span className="text-sm font-bold text-slate-500">{stats.domainTidakAktif}</span>
            </div>

            {/* Domain suspend */}
            <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
              stats.domainSuspend > 0 ? "bg-red-50" : "bg-slate-50"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${stats.domainSuspend > 0 ? "bg-red-500" : "bg-slate-300"}`} />
                <span className="text-xs text-slate-700">Domain suspend</span>
              </div>
              <span className={`text-sm font-bold ${stats.domainSuspend > 0 ? "text-red-600" : "text-slate-400"}`}>
                {stats.domainSuspend}
              </span>
            </div>

            {/* Domain expired soon */}
            <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
              stats.domainExpiredSoon > 0 ? "bg-orange-50" : "bg-slate-50"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${stats.domainExpiredSoon > 0 ? "bg-orange-500" : "bg-slate-300"}`} />
                <span className="text-xs text-slate-700">Expired dalam 30 hari</span>
              </div>
              <span className={`text-sm font-bold ${stats.domainExpiredSoon > 0 ? "text-orange-600" : "text-slate-400"}`}>
                {stats.domainExpiredSoon}
              </span>
            </div>

            {/* Laporan bulan ini */}
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-blue-50">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs text-slate-700">Laporan bulan ini</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{stats.laporanBulanIni}</span>
            </div>

          </div>
        </div>

      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-400">
        Data diperbarui setiap 60 detik · Monitoring uptime dijalankan setiap hari pukul 08.00 WIB
      </p>

    </div>
  )
}