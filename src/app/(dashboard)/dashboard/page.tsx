import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard — SIMDOM" }
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()

  const [totalSkpd, totalDomain, domainAktif, domainTidakAktif, domainSuspend, laporanPending, laporanConfirmed, recentLaporan] = await Promise.all([
    prisma.skpd.count(),
    prisma.webApp.count(),
    prisma.webApp.count({ where: { status: "AKTIF" } }),
    prisma.webApp.count({ where: { status: "TIDAK_AKTIF" } }),
    prisma.webApp.count({ where: { status: "SUSPEND" } }),
    prisma.activityReport.count({ where: { status: "PENDING" } }),
    prisma.activityReport.count({ where: { status: "CONFIRMED" } }),
    prisma.activityReport.findMany({
      take: 5,
      orderBy: { tanggal: "desc" },
      include: {
        webApp: { select: { nama: true, skpd: { select: { singkatan: true } } } },
      },
    }),
  ])

  const domainAktifPct = totalDomain > 0 ? Math.round((domainAktif / totalDomain) * 100) : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Selamat datang, <span className="font-medium text-slate-700">{session?.user.name}</span>
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total SKPD"
          value={totalSkpd}
          sub="Satuan Kerja Perangkat Daerah"
          color="blue"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          }
        />
        <StatCard
          label="Total Domain"
          value={totalDomain}
          sub={`${domainAktifPct}% dalam status aktif`}
          color="indigo"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
            </svg>
          }
        />
        <StatCard
          label="Domain Aktif"
          value={domainAktif}
          sub={`${domainSuspend} suspend · ${domainTidakAktif} tidak aktif`}
          color="teal"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          }
        />
        <StatCard
          label="Laporan Pending"
          value={laporanPending}
          sub={`${laporanConfirmed} sudah dikonfirmasi`}
          color="amber"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          }
        />
      </div>

      {/* Domain Status + Recent Laporan */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Domain Status Breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Status Domain</h3>
          <div className="space-y-3">
            <StatusBar label="Aktif" count={domainAktif} total={totalDomain} colorClass="bg-teal-500" textClass="text-teal-700" bgClass="bg-teal-50" />
            <StatusBar label="Tidak Aktif" count={domainTidakAktif} total={totalDomain} colorClass="bg-slate-400" textClass="text-slate-600" bgClass="bg-slate-50" />
            <StatusBar label="Suspend" count={domainSuspend} total={totalDomain} colorClass="bg-red-400" textClass="text-red-600" bgClass="bg-red-50" />
          </div>

          {/* Total visual */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex overflow-hidden rounded-full h-2.5 gap-0.5">
              {domainAktif > 0 && (
                <div className="bg-teal-500 rounded-l-full transition-all" style={{ width: `${(domainAktif/totalDomain)*100}%` }} />
              )}
              {domainTidakAktif > 0 && (
                <div className="bg-slate-300 transition-all" style={{ width: `${(domainTidakAktif/totalDomain)*100}%` }} />
              )}
              {domainSuspend > 0 && (
                <div className="bg-red-400 rounded-r-full transition-all" style={{ width: `${(domainSuspend/totalDomain)*100}%` }} />
              )}
            </div>
          </div>
        </div>

        {/* Recent Laporan */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Laporan Terbaru</h3>
            <a href="/dashboard/laporan" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Lihat semua →
            </a>
          </div>

          {recentLaporan.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Belum ada laporan aktivitas
            </div>
          ) : (
            <div className="space-y-3">
              {recentLaporan.map((lap) => (
                <div key={lap.id} className="flex items-start gap-3 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                  <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    lap.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    lap.status === "CONFIRMED" ? "bg-teal-100 text-teal-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {lap.status === "PENDING" ? "P" : lap.status === "CONFIRMED" ? "✓" : "I"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{lap.jenisKegiatan}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="font-medium text-blue-600">{lap.webApp.skpd.singkatan}</span>
                      {" · "}
                      {lap.webApp.nama}
                      {" · "}
                      {new Date(lap.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub Components ───────────────────────────────────────

interface StatCardProps {
  label: string
  value: number
  sub: string
  color: "blue" | "indigo" | "teal" | "amber"
  icon: React.ReactNode
}

const COLOR_MAP = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   icon: "bg-blue-100 text-blue-600",   border: "border-l-blue-500" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", icon: "bg-indigo-100 text-indigo-600", border: "border-l-indigo-500" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-700",   icon: "bg-teal-100 text-teal-600",   border: "border-l-teal-500" },
  amber:  { bg: "bg-amber-50",  text: "text-amber-700",  icon: "bg-amber-100 text-amber-600", border: "border-l-amber-500" },
}

function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  const c = COLOR_MAP[color]
  return (
    <div className={`card p-5 border-l-4 ${c.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{sub}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatusBar({ label, count, total, colorClass, textClass, bgClass }: {
  label: string; count: number; total: number
  colorClass: string; textClass: string; bgClass: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className={`text-xs font-semibold ${textClass}`}>{count} ({pct}%)</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}