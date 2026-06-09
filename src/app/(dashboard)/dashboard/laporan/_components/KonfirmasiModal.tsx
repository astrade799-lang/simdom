"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { konfirmasiLaporan, instruksiLaporan } from "@/actions/laporan"
import { ActivityBadge } from "@/components/ui/Badge"
import type { ActivityStatus } from "@prisma/client"

type Laporan = {
  id: string
  jenisKegiatan: string
  deskripsi: string
  tanggal: Date
  status: ActivityStatus
  instruksi: string | null
  webApp: {
    nama: string
    url: string
    skpd: { nama: string; singkatan: string }
  }
}

interface KonfirmasiModalProps {
  isOpen: boolean
  onClose: () => void
  laporan: Laporan | null
}

export function KonfirmasiModal({ isOpen, onClose, laporan }: KonfirmasiModalProps) {
  const [mode, setMode] = useState<"konfirmasi" | "instruksi">("konfirmasi")
  const [instruksi, setInstruksi] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setMode("konfirmasi")
      setInstruksi("")
      setError(null)
    }
  }, [isOpen])

  if (!laporan) return null

  async function handleSubmit() {
    setError(null)
    setIsLoading(true)
    const result = mode === "konfirmasi"
      ? await konfirmasiLaporan(laporan!.id)
      : await instruksiLaporan(laporan!.id, instruksi)
    setIsLoading(false)
    if (!result.success) { setError(result.message); return }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tindakan Kabid" size="md">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Detail Laporan */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Detail Laporan</span>
            <ActivityBadge status={laporan.status} />
          </div>
          <p className="text-sm font-semibold text-gray-900">{laporan.jenisKegiatan}</p>
          <p className="text-xs text-blue-600 font-mono">{laporan.webApp.url}</p>
          <p className="text-xs text-gray-500">
            {new Date(laporan.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-sm text-gray-600 border-t border-gray-200 pt-2">{laporan.deskripsi}</p>
          {laporan.instruksi && (
            <div className="rounded-md bg-blue-50 p-2 border-t border-gray-200 mt-1">
              <p className="text-xs font-medium text-blue-700">Instruksi sebelumnya:</p>
              <p className="text-sm text-blue-600">{laporan.instruksi}</p>
            </div>
          )}
        </div>

        {/* Pilihan Tindakan */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tindakan</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("konfirmasi")}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                mode === "konfirmasi"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              ✓ Konfirmasi
            </button>
            <button
              type="button"
              onClick={() => setMode("instruksi")}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                mode === "instruksi"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              ✎ Beri Instruksi
            </button>
          </div>
        </div>

        {/* Input Instruksi */}
        {mode === "instruksi" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instruksi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={instruksi}
              onChange={(e) => setInstruksi(e.target.value)}
              rows={3}
              placeholder="Tuliskan instruksi untuk admin terkait laporan ini..."
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || (mode === "instruksi" && !instruksi.trim())}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition-colors ${
              mode === "konfirmasi" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Menyimpan..." : mode === "konfirmasi" ? "Konfirmasi Laporan" : "Kirim Instruksi"}
          </button>
        </div>
      </div>
    </Modal>
  )
}