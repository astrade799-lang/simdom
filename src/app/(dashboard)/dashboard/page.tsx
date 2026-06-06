import { auth } from "@/auth"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard — SIMDOM",
}

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Selamat datang, {session?.user.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Total SKPD", "Total Domain", "Domain Aktif", "Laporan Pending"].map(
          (label) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}