"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { deleteDomain } from "@/actions/domain"
import { StatusBadge } from "@/components/ui/Badge"
import { DomainModal } from "./DomainModal"
import type { WebStatus, Role } from "@prisma/client"

type WebApp = {
  id: string
  nama: string
  url: string
  status: WebStatus
  alasanSuspend: string | null
  adminTeknis: string
  kontakAdmin: string
  vendor: string | null
  kontakVendor: string | null
  platform: string | null
  tanggalAktif: Date | null
  tanggalExpired: Date | null
  skpdId: string
  skpd: { nama: string; singkatan: string }
}

type SkpdOption = { id: string; nama: string; singkatan: string }

interface DomainTableProps {
  webApps: WebApp[]
  skpds: SkpdOption[]
  total: number
  page: number
  pageSize: number
  userRole: Role
}

export function DomainTable({
  webApps, skpds, total, page, pageSize, userRole,
}: DomainTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get("search") || ""
  const currentStatus = searchParams.get("status") || ""
  const currentSkpdId = searchParams.get("skpdId") || ""

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<WebApp | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [searchInput, setSearchInput] = useState(currentSearch)

  const totalPages = Math.ceil(total / pageSize)
  const canEdit = userRole === "SUPER_ADMIN" || userRole === "ADMIN"
  const canDelete = userRole === "SUPER_ADMIN"

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function updateFilter(key: string, value: string) {
  const params = new URLSearchParams(searchParams.toString())
  if (value) {
    params.set(key, value)
  } else {
    params.delete(key)
  }
  params.set("page", "1")
  window.location.href = `${pathname}?${params.toString()}`
}

function goToPage(newPage: number) {
  const params = new URLSearchParams(searchParams.toString())
  params.set("page", String(newPage))
  window.location.href = `${pathname}?${params.toString()}`
}

function handleReset() {
  setSearchInput("")
  window.location.href = pathname
}


  async function handleDelete(id: string) {
    setIsDeleting(true)
    const result = await deleteDomain(id)
    setIsDeleting(false)
    setDeleteConfirm(null)
    showToast(result.message, result.success ? "success" : "error")
  }

  const selectClass = "rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
  const hasFilter = currentSearch || currentStatus || currentSkpdId

  return (
    <>
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama atau domain..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateFilter("search", searchInput)
            }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Filter */}
        <select
          value={currentStatus}
          onChange={(e) => updateFilter("status", e.target.value)}
          className={selectClass}
        >
          <option value="">Semua Status</option>
          <option value="AKTIF">Aktif</option>
          <option value="TIDAK_AKTIF">Tidak Aktif</option>
          <option value="SUSPEND">Suspend</option>
        </select>

        {/* SKPD Filter */}
        <select
          value={currentSkpdId}
          onChange={(e) => updateFilter("skpdId", e.target.value)}
          className={`${selectClass} max-w-[200px]`}
        >
          <option value="">Semua SKPD</option>
          {skpds.map((s) => (
            <option key={s.id} value={s.id}>{s.singkatan}</option>
          ))}
        </select>

        {/* Reset */}
        {hasFilter && (
          <button onClick={handleReset} className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            Reset
          </button>
        )}

        {/* Search Button */}
        <button
          onClick={() => updateFilter("search", searchInput)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cari
        </button>

        {/* Add Button */}
        {canEdit && (
          <button
            onClick={() => { setSelectedDomain(null); setIsModalOpen(true) }}
            className="ml-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Domain
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama Aplikasi</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">URL / Subdomain</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">SKPD</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Admin Teknis</th>
                {(canEdit || canDelete) && (
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {webApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Tidak ada domain ditemukan
                  </td>
                </tr>
              ) : (
                webApps.map((app, i) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{(page - 1) * pageSize + i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{app.nama}</p>
                      {app.platform && <p className="text-xs text-gray-400 mt-0.5">{app.platform}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`https://${app.url}`} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-600 hover:underline">
                        {app.url}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {app.skpd.singkatan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                      {app.status === "SUSPEND" && app.alasanSuspend && (
                        <p className="mt-1 text-xs text-red-500">{app.alasanSuspend}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{app.adminTeknis}</p>
                      <p className="text-xs text-gray-400">{app.kontakAdmin}</p>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {canEdit && (
                            <button onClick={() => { setSelectedDomain(app); setIsModalOpen(true) }}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteConfirm(app.id)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6m4-6v6" /><path d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">
            {total === 0
              ? "Tidak ada data"
              : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} dari ${total} domain`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button key={p} onClick={() => goToPage(p)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${p === page ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Hapus Domain?</h3>
            <p className="mt-2 text-sm text-gray-500">Data domain akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {isDeleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <DomainModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        domain={selectedDomain}
        skpds={skpds}
      />
    </>
  )
}