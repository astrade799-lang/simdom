import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard — SIMDOM" }

// Ganti force-dynamic dengan revalidate
// Data refresh tiap 60 detik, bukan tiap request
export const revalidate = 60

// ✅ Pisahkan data fetching — lebih mudah di-maintain
async function getDashboardStats() {
  try {
    const [
      totalSkpd,
      totalDomain,
      domainAktif,
      domainTidakAktif,
      domainSuspend,
      laporanPending,
      laporanConfirmed,
      laporanInstructed,
      recentLaporan,
      topSkpd,
    ] = await Promise.all([
      prisma.skpd.count(),
      prisma.webApp.count(),
      prisma.webApp.count({ where: { status: "AKTIF" } }),
      prisma.webApp.count({ where: { status: "TIDAK_AKTIF" } }),
      prisma.webApp.count({ where: { status: "SUSPEND" } }),
      prisma.activityReport.count({ where: { status: "PENDING" } }),
      prisma.activityReport.count({ where: { status: "CONFIRMED" } }),
      prisma.activityReport.count({ where: { status: "INSTRUCTED" } }),
      prisma.activityReport.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        // ✅ select lebih efisien daripada include
        select: {
          id: true,
          jenisKegiatan: true,
          status: true,
          tanggal: true,
          webApp: {
            select: {
              nama: true,
              skpd: { select: { singkatan: true } },
            },
          },
        },
      }),
      prisma.skpd.findMany({
        take: 5,
        select: {
          id: true,
          singkatan: true,
          _count: { select: { webApps: true } },
        },
        orderBy: { webApps: { _count: "desc" } },
      }),
    ])

    return {
      totalSkpd, totalDomain, domainAktif, domainTidakAktif, domainSuspend,
      laporanPending, laporanConfirmed, laporanInstructed,
      recentLaporan, topSkpd,
      error: null,
    }
  } catch (error) {
    console.error("[DASHBOARD] Failed to fetch stats:", error)
    // ✅ Return fallback values — halaman tidak crash
    return {
      totalSkpd: 0, totalDomain: 0, domainAktif: 0,
      domainTidakAktif: 0, domainSuspend: 0,
      laporanPending: 0, laporanConfirmed: 0, laporanInstructed: 0,
      recentLaporan: [], topSkpd: [],
      error: "Gagal memuat data. Silakan refresh halaman.",
    }
  }
}

export default async function DashboardPage() {
  // ✅ Security: validasi session, redirect kalau tidak login
  const session = await auth()
  if (!session?.user) redirect("/login")

  const stats = await getDashboardStats()

  const aktifPct = stats.totalDomain > 0
    ? Math.round((stats.domainAktif / stats.totalDomain) * 100)
    : 0
  const totalLaporan = stats.laporanPending + stats.laporanConfirmed + stats.laporanInstructed

  return (
    <div className="space-y-6">

      {/* ✅ Error Banner */}
      {stats.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"/>
          </svg>
          {stats.error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Selamat datang kembali,{" "}
            <span className="font-semibold text-slate-700">
              {session.user.name ?? "Pengguna"}
            </span>
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long", day: "numeric",
              month: "long", year: "numeric",
            })}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Diskominfo Kabupaten Soppeng</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-lg shadow-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total SKPD</p>
              <p className="text-4xl font-bold mt-2">{stats.totalSkpd}</p>
              <p className="text-xs text-blue-200 mt-1">Satuan Kerja</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 p-5 text-white shadow-lg shadow-violet-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-violet-100 uppercase tracking-wider">Total Domain</p>
              <p className="text-4xl font-bold mt-2">{stats.totalDomain}</p>
              <p className="text-xs text-violet-200 mt-1">{aktifPct}% aktif</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Domain Aktif</p>
              <p className="text-4xl font-bold mt-2">{stats.domainAktif}</p>
              <p className="text-xs text-emerald-100 mt-1">
                {stats.domainSuspend > 0 ? `${stats.domainSuspend} suspend` : "Semua berjalan"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-5 text-white shadow-lg ${
          stats.laporanPending > 0
            ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200"
            : "bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-200"
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">Laporan Pending</p>
              <p className="text-4xl font-bold mt-2">{stats.laporanPending}</p>
              <p className="text-xs text-white/70 mt-1">
                {stats.laporanPending > 0 ? "Perlu konfirmasi" : "Semua selesai"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 relative">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {stats.laporanPending > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"/>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"/>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Domain Status */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Status Domain</h3>
          <p className="text-xs text-slate-400 mb-5">Ringkasan kondisi seluruh domain</p>
          <div className="space-y-4">
            {[
              { label: "Aktif", count: stats.domainAktif, color: "bg-emerald-500", text: "text-emerald-700" },
              { label: "Tidak Aktif", count: stats.domainTidakAktif, color: "bg-slate-300", text: "text-slate-500" },
              { label: "Suspend", count: stats.domainSuspend, color: "bg-red-500", text: "text-red-600" },
            ].map((item) => {
              const pct = stats.totalDomain > 0
                ? Math.round((item.count / stats.totalDomain) * 100)
                : 0
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
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
                    <div className={`h-2 rounded-full transition-all duration-700 ${item.color}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex gap-1 h-3">
            {stats.domainAktif > 0 && (
              <div className="bg-emerald-500 rounded-l-full h-3"
                style={{ width: `${(stats.domainAktif / stats.totalDomain) * 100}%` }} />
            )}
            {stats.domainTidakAktif > 0 && (
              <div className="bg-slate-300 h-3"
                style={{ width: `${(stats.domainTidakAktif / stats.totalDomain) * 100}%` }} />
            )}
            {stats.domainSuspend > 0 && (
              <div className="bg-red-500 rounded-r-full h-3"
                style={{ width: `${(stats.domainSuspend / stats.totalDomain) * 100}%` }} />
            )}
            {stats.domainSuspend === 0 && stats.domainTidakAktif === 0 && (
              <div className="bg-emerald-500 rounded-full h-3 w-full" />
            )}
          </div>
        </div>

        {/* Laporan Status */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Laporan Aktivitas</h3>
          <p className="text-xs text-slate-400 mb-5">Status penanganan laporan</p>
          <div className="space-y-3">
            {[
              { label: "Pending", count: stats.laporanPending, bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", href: "/dashboard/laporan?status=PENDING" },
              { label: "Dikonfirmasi", count: stats.laporanConfirmed, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", href: "/dashboard/laporan?status=CONFIRMED" },
              { label: "Diberi Instruksi", count: stats.laporanInstructed, bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", href: "/dashboard/laporan?status=INSTRUCTED" },
            ].map((item) => (
              <Link key={item.label} href={item.href}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${item.bg} hover:opacity-80 transition-opacity`}>
                <div className="flex items-center gap-2.5">
                  <div className={`h-2 w-2 rounded-full ${item.dot}`} />
                  <span className={`text-sm font-medium ${item.text}`}>{item.label}</span>
                </div>
                <span className={`text-xl font-bold ${item.text}`}>{item.count}</span>
              </Link>
            ))}
          </div>
          {totalLaporan > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">{totalLaporan} total laporan tercatat</p>
            </div>
          )}
        </div>

        {/* Top SKPD */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-900">Top SKPD</h3>
            <Link href="/dashboard/skpd" className="text-xs text-blue-600 hover:text-blue-700">
              Lihat semua →
            </Link>
          </div>
          <p className="text-xs text-slate-400 mb-5">Berdasarkan jumlah domain</p>
          <div className="space-y-3">
            {stats.topSkpd.map((skpd, i) => {
              const pct = stats.totalDomain > 0
                ? Math.round((skpd._count.webApps / stats.totalDomain) * 100)
                : 0
              return (
                <div key={skpd.id} className="flex items-center gap-3">
                  <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    i === 0 ? "bg-blue-600 text-white" :
                    i === 1 ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700 truncate">{skpd.singkatan}</span>
                      <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{skpd._count.webApps} domain</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-blue-500 transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Aktivitas Terbaru</h3>
            <p className="text-xs text-slate-400 mt-0.5">5 laporan terakhir yang masuk</p>
          </div>
          <Link href="/dashboard/laporan"
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Semua Laporan
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {stats.recentLaporan.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <p className="text-sm text-slate-400">Belum ada laporan aktivitas</p>
          </div>
        ) : (
          <div className="space-y-1">
            {stats.recentLaporan.map((lap, i) => {
              const statusConfig = {
                PENDING: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending", dot: "bg-amber-500" },
                CONFIRMED: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Konfirmasi", dot: "bg-emerald-500" },
                INSTRUCTED: { bg: "bg-blue-100", text: "text-blue-700", label: "Instruksi", dot: "bg-blue-500" },
              } as const
              const s = statusConfig[lap.status]
              return (
                <div key={lap.id}
                  className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-slate-50">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${s.bg}`}>
                    <div className={`h-2 w-2 rounded-full ${s.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{lap.jenisKegiatan}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="font-medium text-blue-600">{lap.webApp.skpd.singkatan}</span>
                      {" · "}
                      {lap.webApp.nama}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(lap.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short",
                      })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}