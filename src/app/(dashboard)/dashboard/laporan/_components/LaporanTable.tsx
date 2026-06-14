"use client"

import { useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { deleteLaporan } from "@/actions/laporan"
import { ActivityBadge } from "@/components/ui/Badge"
import { LaporanModal } from "./LaporanModal"
import { KonfirmasiModal } from "./KonfirmasiModal"
import type { ActivityStatus, Role } from "@prisma/client"
import * as XLSX from "xlsx"
import { LaporanDetailModal } from "./LaporanDetailModal"

type Laporan = {
  id: string
  jenisKegiatan: string
  deskripsi: string
  tanggal: Date
  status: ActivityStatus
  instruksi: string | null
  buktiUrl?: string | null
  webAppId: string
  webApp: {
    nama: string
    url: string
    skpd: { nama: string; singkatan: string }
  }
}

type WebAppOption = {
  id: string
  nama: string
  url: string
  skpd: { singkatan: string }
}

type SkpdOption = { id: string; singkatan: string }

interface LaporanTableProps {
  laporans: Laporan[]
  webApps: WebAppOption[]
  skpds: SkpdOption[]
  total: number
  page: number
  pageSize: number
  userRole: Role
}

const STATUS_LABEL: Record<ActivityStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Dikonfirmasi",
  INSTRUCTED: "Diberi Instruksi",
}

const DATE_PRESETS = [
  { value: "", label: "Semua" },
  { value: "today", label: "Hari ini" },
  { value: "week", label: "7 Hari" },
  { value: "month", label: "Bulan ini" },
  { value: "last_month", label: "Bulan lalu" },
  { value: "custom", label: "Pilih Tanggal" },
]

export function LaporanTable({
  laporans, webApps, skpds, total, page, pageSize, userRole,
}: LaporanTableProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get("search") || ""
  const currentStatus = searchParams.get("status") || ""
  const currentSkpdId = searchParams.get("skpdId") || ""
  const currentPreset = searchParams.get("preset") || ""
  const currentDateFrom = searchParams.get("dateFrom") || ""
  const currentDateTo = searchParams.get("dateTo") || ""

  const [searchInput, setSearchInput] = useState(currentSearch)
  const [showCustomDate, setShowCustomDate] = useState(currentPreset === "custom")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isKonfirmasiOpen, setIsKonfirmasiOpen] = useState(false)
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const totalPages = Math.ceil(total / pageSize)
  const canEdit = userRole === "SUPER_ADMIN" || userRole === "ADMIN"
  const canKonfirmasi = userRole === "SUPER_ADMIN" || userRole === "KABID"

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function updateFilter(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.set("page", "1")
    window.location.href = `${pathname}?${params.toString()}`
  }

  function handlePreset(value: string) {
    if (value === "custom") {
      setShowCustomDate(true)
      updateFilter({ preset: "custom", dateFrom: "", dateTo: "" })
    } else {
      setShowCustomDate(false)
      updateFilter({ preset: value, dateFrom: "", dateTo: "" })
    }
  }

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    window.location.href = `${pathname}?${params.toString()}`
  }

  async function handleDelete(id: string) {
    setIsDeleting(true)
    const result = await deleteLaporan(id)
    setIsDeleting(false)
    setDeleteConfirm(null)
    showToast(result.message, result.success ? "success" : "error")
  }

  function handleExport() {
    const rows = laporans.map((lap, i) => ({
      "No": i + 1,
      "Jenis Kegiatan": lap.jenisKegiatan,
      "Domain": lap.webApp.nama,
      "URL": lap.webApp.url,
      "SKPD": lap.webApp.skpd.singkatan,
      "Tanggal": new Date(lap.tanggal).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
      }),
      "Status": STATUS_LABEL[lap.status],
      "Deskripsi": lap.deskripsi,
      "Instruksi": lap.instruksi ?? "-",
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Aktivitas")

    // Auto column width
    const cols = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)) + 2,
    }))
    ws["!cols"] = cols

    const date = new Date().toLocaleDateString("id-ID").replace(/\//g, "-")
    XLSX.writeFile(wb, `Laporan_Aktivitas_${date}.xlsx`)
    showToast(`${laporans.length} laporan berhasil diekspor`, "success")
  }

  const selectClass = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
  const hasFilter = currentSearch || currentStatus || currentSkpdId || currentPreset

  return (
    <>
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-4 space-y-3">

        {/* Row 1: Search + Status + SKPD + Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Cari jenis kegiatan atau domain..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") updateFilter({ search: searchInput }) }}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select value={currentStatus} onChange={(e) => updateFilter({ status: e.target.value })} className={selectClass}>
            <option value="">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Dikonfirmasi</option>
            <option value="INSTRUCTED">Diberi Instruksi</option>
          </select>

          <select value={currentSkpdId} onChange={(e) => updateFilter({ skpdId: e.target.value })} className={`${selectClass} max-w-[160px]`}>
            <option value="">Semua SKPD</option>
            {skpds.map((s) => (
              <option key={s.id} value={s.id}>{s.singkatan}</option>
            ))}
          </select>

          {hasFilter && (
            <button onClick={() => { setSearchInput(""); setShowCustomDate(false); window.location.href = pathname }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
              Reset
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Export Button */}
            {laporans.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export Excel
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => { setSelectedLaporan(null); setIsModalOpen(true) }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Tambah Laporan
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Date filter presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Periode:</span>
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (currentPreset === p.value) || (!currentPreset && p.value === "")
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </button>
          ))}

          {/* Custom date range */}
          {(showCustomDate || currentPreset === "custom") && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                defaultValue={currentDateFrom}
                onBlur={(e) => updateFilter({ preset: "custom", dateFrom: e.target.value })}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                defaultValue={currentDateTo}
                onBlur={(e) => updateFilter({ preset: "custom", dateTo: e.target.value })}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-10">No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Kegiatan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Domain</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {laporans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    Tidak ada laporan ditemukan
                  </td>
                </tr>
              ) : (
                laporans.map((lap, i) => (
                  <tr key={lap.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{(page - 1) * pageSize + i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{lap.jenisKegiatan}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{lap.deskripsi}</p>
                      {lap.instruksi && (
                        <p className="text-xs text-blue-600 mt-0.5 line-clamp-1">📋 {lap.instruksi}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700 text-xs">{lap.webApp.nama}</p>
                      <span className="text-[10px] rounded bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-600">
                        {lap.webApp.skpd.singkatan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(lap.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <ActivityBadge status={lap.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {canKonfirmasi && lap.status === "PENDING" && (
                          <button
                            onClick={() => { setSelectedLaporan(lap); setIsKonfirmasiOpen(true) }}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            Tindakan
                          </button>
                        )}
                        {/* Tombol Lihat Detail */}
<button
  onClick={() => { setSelectedLaporan(lap); setIsDetailOpen(true) }}
  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
  title="Lihat Detail"
>
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
</button>
                        {canEdit && lap.status === "PENDING" && (
                          <button
                            onClick={() => { setSelectedLaporan(lap); setIsModalOpen(true) }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => setDeleteConfirm(lap.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Hapus"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-400">
            {total === 0 ? "Tidak ada data" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} dari ${total} laporan`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button key={p} onClick={() => goToPage(p)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${p === page ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)}/>
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Hapus Laporan?</h3>
            <p className="mt-2 text-sm text-slate-500">Data laporan akan dihapus permanen.</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {isDeleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <LaporanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        laporan={selectedLaporan}
        webApps={webApps}
      />
      <KonfirmasiModal
        isOpen={isKonfirmasiOpen}
        onClose={() => setIsKonfirmasiOpen(false)}
        laporan={selectedLaporan}
      />
      <LaporanDetailModal
  isOpen={isDetailOpen}
  onClose={() => setIsDetailOpen(false)}
  laporan={selectedLaporan}
/>
    </>
  )
}