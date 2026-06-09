import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard — SIMDOM" }
export const dynamic = "force-dynamic"

interface StatCardProps {
  label: string
  value: number
  colorClass: string
  borderClass: string
}

function StatCard({ label, value, colorClass, borderClass }: StatCardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm border-l-4 ${borderClass}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth()

  const [totalSkpd, totalDomain, domainAktif, laporanPending] = await Promise.all([
    prisma.skpd.count(),
    prisma.webApp.count(),
    prisma.webApp.count({ where: { status: "AKTIF" } }),
    prisma.activityReport.count({ where: { status: "PENDING" } }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Selamat datang, {session?.user.name}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total SKPD" value={totalSkpd} colorClass="text-blue-700" borderClass="border-l-blue-500" />
        <StatCard label="Total Domain" value={totalDomain} colorClass="text-gray-700" borderClass="border-l-gray-400" />
        <StatCard label="Domain Aktif" value={domainAktif} colorClass="text-green-700" borderClass="border-l-green-500" />
        <StatCard label="Laporan Pending" value={laporanPending} colorClass="text-yellow-700" borderClass="border-l-yellow-500" />
      </div>
    </div>
  )
}