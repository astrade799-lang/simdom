"use client"

import { useState, useMemo } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { deleteLaporan } from "@/actions/laporan"
import { ActivityBadge } from "@/components/ui/Badge"
import { LaporanModal } from "./LaporanModal"
import { KonfirmasiModal } from "./KonfirmasiModal"
import type { ActivityStatus, Role } from "@prisma/client"
import * as XLSX from "xlsx"
import { generateLaporanPDF } from "@/lib/pdf-laporan"
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
  kabid: { namaLengkap: string | null; nip: string | null; name: string } | null
  pembuat: { namaLengkap: string | null; nip: string | null; name: string } | null
}

const STATUS_LABEL: Record<ActivityStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Dikonfirmasi",
  INSTRUCTED: "Diberi Instruksi",
}

// ✅ Tab periode — client-side only
const DATE_PRESETS = [
  { value: "all", label: "Semua" },
  { value: "today", label: "Hari ini" },
  { value: "week", label: "7 Hari" },
  { value: "month", label: "Bulan ini" },
  { value: "last_month", label: "Bulan lalu" },
]

// ✅ Filter data berdasarkan preset — pure client
function filterByPreset(laporans: Laporan[], preset: string): Laporan[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case "today":
      return laporans.filter((l) => {
        const t = new Date(l.tanggal)
        return t >= today && t < new Date(today.getTime() + 86400000)
      })
    case "week":
      const weekAgo = new Date(today.getTime() - 6 * 86400000)
      return laporans.filter((l) => new Date(l.tanggal) >= weekAgo)
    case "month":
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return laporans.filter((l) => new Date(l.tanggal) >= monthStart)
    case "last_month":
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return laporans.filter((l) => {
        const t = new Date(l.tanggal)
        return t >= lastMonthStart && t <= lastMonthEnd
      })
    default:
      return laporans
  }
}

export function LaporanTable({
  laporans, webApps, skpds, total, page, pageSize, userRole, kabid, pembuat
}: LaporanTableProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get("search") || ""
  const currentStatus = searchParams.get("status") || ""
  const currentSkpdId = searchParams.get("skpdId") || ""
  const currentDateFrom = searchParams.get("dateFrom") || ""
  const currentDateTo = searchParams.get("dateTo") || ""

  const [searchInput, setSearchInput] = useState(currentSearch)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isKonfirmasiOpen, setIsKonfirmasiOpen] = useState(false)
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // ✅ Tab periode — state client-side (tidak reload!)
  const [activePreset, setActivePreset] = useState("all")
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [customFrom, setCustomFrom] = useState(currentDateFrom)
  const [customTo, setCustomTo] = useState(currentDateTo)

  const [showExportDialog, setShowExportDialog] = useState(false)
const [exportOptions, setExportOptions] = useState({
  includeTTD: true,
  includeKabid: true,
  includePembuat: true,
  orientation: "portrait" as "portrait" | "landscape",
  format: "a4" as "a4" | "f4",
})

  // ✅ Filter data di client
  const filteredLaporans = useMemo(() => {
    let data = filterByPreset(laporans, activePreset)

    // Filter custom date range
    if (showCustomDate && (customFrom || customTo)) {
      data = data.filter((l) => {
        const t = new Date(l.tanggal)
        if (customFrom && t < new Date(customFrom)) return false
        if (customTo && t > new Date(customTo + "T23:59:59")) return false
        return true
      })
    }
    return data
  }, [laporans, activePreset, showCustomDate, customFrom, customTo])

  const totalPages = Math.ceil(total / pageSize)
  const canEdit = userRole === "SUPER_ADMIN" || userRole === "ADMIN"
  const canKonfirmasi = userRole === "SUPER_ADMIN" || userRole === "KABID"

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Server-side filter (search, status, skpd) — tetap reload
  function updateFilter(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.set("page", "1")
    window.location.href = `${pathname}?${params.toString()}`
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
    const rows = filteredLaporans.map((lap, i) => ({
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

    const cols = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)) + 2,
    }))
    ws["!cols"] = cols

    const date = new Date().toLocaleDateString("id-ID").replace(/\//g, "-")
    XLSX.writeFile(wb, `Laporan_Aktivitas_${date}.xlsx`)
    showToast(`${filteredLaporans.length} laporan berhasil diekspor`, "success")
  }

  async function handleExportPDF() {
    const presetLabel: Record<string, string> = {
      all: "Semua Periode",
      today: "Hari Ini",
      week: "7 Hari Terakhir",
      month: "Bulan Ini",
      last_month: "Bulan Lalu",
    }
    const periode = showCustomDate && (customFrom || customTo)
      ? `${customFrom || "..."} s/d ${customTo || "..."}`
      : presetLabel[activePreset] ?? "Semua Periode"

    await generateLaporanPDF(filteredLaporans, periode, filteredLaporans.length, kabid, pembuat)
  }

  const selectClass = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
  const hasFilter = currentSearch || currentStatus || currentSkpdId

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
            <button onClick={() => { setSearchInput(""); window.location.href = pathname }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
              Reset
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {filteredLaporans.length > 0 && (
              <button onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export Excel
              </button>
            )}

            {filteredLaporans.length > 0 && (
  <button
    onClick={() => setShowExportDialog(true)}
    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
  >
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </svg>
    Export PDF
  </button>
)}

            {canEdit && (
              <button onClick={() => { setSelectedLaporan(null); setIsModalOpen(true) }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Tambah Laporan
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Tab Periode — CLIENT SIDE ✅ */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Periode:</span>
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setActivePreset(p.value)
                setShowCustomDate(false)
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activePreset === p.value && !showCustomDate
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </button>
          ))}

          {/* Pilih Tanggal */}
          <button
            onClick={() => { setShowCustomDate(true); setActivePreset("") }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              showCustomDate
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Pilih Tanggal
          </button>

          {showCustomDate && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Counter hasil filter */}
          {activePreset !== "all" || showCustomDate ? (
            <span className="ml-auto text-xs text-slate-400">
              {filteredLaporans.length} laporan
            </span>
          ) : null}
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
              {filteredLaporans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    Tidak ada laporan ditemukan
                  </td>
                </tr>
              ) : (
                filteredLaporans.map((lap, i) => (
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
                          <button onClick={() => { setSelectedLaporan(lap); setIsKonfirmasiOpen(true) }}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">
                            Tindakan
                          </button>
                        )}
                        <button onClick={() => { setSelectedLaporan(lap); setIsDetailOpen(true) }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                          title="Lihat Detail">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        {canEdit && lap.status === "PENDING" && (
                          <button onClick={() => { setSelectedLaporan(lap); setIsModalOpen(true) }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Edit">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => setDeleteConfirm(lap.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Hapus">
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
            {filteredLaporans.length === 0 ? "Tidak ada data"
              : activePreset !== "all" || showCustomDate
                ? `${filteredLaporans.length} laporan (filter aktif)`
                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} dari ${total} laporan`}
          </p>
          {totalPages > 1 && activePreset === "all" && !showCustomDate && (
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

      <LaporanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} laporan={selectedLaporan} webApps={webApps} />
      <KonfirmasiModal isOpen={isKonfirmasiOpen} onClose={() => setIsKonfirmasiOpen(false)} laporan={selectedLaporan} />
      <LaporanDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} laporan={selectedLaporan} />

      {/* Export PDF Dialog */}
{showExportDialog && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40" onClick={() => setShowExportDialog(false)}/>
    <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">

      <h3 className="text-base font-semibold text-slate-900 mb-1">Export Laporan PDF</h3>
      <p className="text-xs text-slate-400 mb-5">{filteredLaporans.length} laporan akan diekspor</p>

      {/* Ukuran Kertas */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Ukuran Kertas</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "a4", label: "A4", desc: "210 × 297 mm" },
            { value: "f4", label: "F4", desc: "215 × 330 mm" },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setExportOptions(o => ({ ...o, format: f.value as "a4" | "f4" }))}
              className={`rounded-lg border p-3 text-left transition-colors ${
                exportOptions.format === f.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <p className={`text-sm font-semibold ${exportOptions.format === f.value ? "text-blue-700" : "text-slate-700"}`}>
                {f.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Orientasi */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Orientasi</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "portrait", label: "Portrait", desc: "Vertikal" },
            { value: "landscape", label: "Landscape", desc: "Horizontal" },
          ].map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setExportOptions(op => ({ ...op, orientation: o.value as "portrait" | "landscape" }))}
              className={`rounded-lg border p-3 text-left transition-colors ${
                exportOptions.orientation === o.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <p className={`text-sm font-semibold ${exportOptions.orientation === o.value ? "text-blue-700" : "text-slate-700"}`}>
                {o.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{o.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Opsi Tanda Tangan */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Tanda Tangan</p>
        <div className="space-y-2">
          {[
            { key: "includePembuat", label: "Sertakan nama pembuat laporan" },
            { key: "includeKabid", label: "Sertakan nama Kabid / Pengesah" },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={exportOptions[opt.key as keyof typeof exportOptions] as boolean}
                onChange={(e) => setExportOptions(o => ({ ...o, [opt.key]: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowExportDialog(false)}
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={async () => {
            setShowExportDialog(false)
            const presetLabel: Record<string, string> = {
              all: "Semua Periode", today: "Hari Ini",
              week: "7 Hari Terakhir", month: "Bulan Ini", last_month: "Bulan Lalu",
            }
            const periode = showCustomDate && (customFrom || customTo)
              ? `${customFrom || "..."} s/d ${customTo || "..."}`
              : presetLabel[activePreset] ?? "Semua Periode"

            await generateLaporanPDF(
              filteredLaporans,
              periode,
              filteredLaporans.length,
              exportOptions.includeKabid ? kabid : null,
              exportOptions.includePembuat ? pembuat : null,
              exportOptions.orientation,
              exportOptions.format,
            )
          }}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Export PDF
        </button>
      </div>

    </div>
  </div>
)}
    </>
  )
}