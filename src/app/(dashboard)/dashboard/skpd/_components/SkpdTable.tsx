"use client"

import { useState } from "react"
import { deleteSkpd } from "@/actions/skpd"
import { SkpdModal } from "./SkpdModal"

type Skpd = {
  id: string
  nama: string
  singkatan: string
  penanggungjawab: string
  kontak: string
  _count: { webApps: number }
}

export function SkpdTable({ skpds }: { skpds: Skpd[] }) {
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSkpd, setSelectedSkpd] = useState<Skpd | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const filtered = skpds.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.singkatan.toLowerCase().includes(search.toLowerCase())
  )

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDelete(id: string) {
    setIsDeleting(true)
    const result = await deleteSkpd(id)
    setIsDeleting(false)
    setDeleteConfirm(null)
    showToast(result.message, result.success ? "success" : "error")
  }

  return (
    <>
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama atau singkatan SKPD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          onClick={() => { setSelectedSkpd(null); setIsModalOpen(true) }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah SKPD
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama SKPD</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Singkatan</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Penanggung Jawab</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Kontak</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Domain</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">Tidak ada SKPD ditemukan</td>
                </tr>
              ) : (
                filtered.map((skpd, i) => (
                  <tr key={skpd.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{skpd.nama}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{skpd.singkatan}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{skpd.penanggungjawab}</td>
                    <td className="px-4 py-3 text-gray-600">{skpd.kontak}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">{skpd._count.webApps}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedSkpd(skpd); setIsModalOpen(true) }}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(skpd.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Hapus">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6m4-6v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
          Menampilkan {filtered.length} dari {skpds.length} SKPD
        </div>
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Hapus SKPD?</h3>
            <p className="mt-2 text-sm text-gray-500">SKPD yang masih memiliki domain tidak bisa dihapus. Tindakan ini tidak bisa dibatalkan.</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={isDeleting} className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {isDeleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SkpdModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} skpd={selectedSkpd} />
    </>
  )
}