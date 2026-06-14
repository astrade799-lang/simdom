"use client"

import { useState, useRef, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { createLaporan, updateLaporan } from "@/actions/laporan"
import { ImageUpload } from "@/components/ui/ImageUpload"
import type { ActivityStatus } from "@prisma/client"

type Laporan = {
  id: string
  jenisKegiatan: string
  deskripsi: string
  tanggal: Date
  status: ActivityStatus
  webAppId: string
  buktiUrl?: string | null
}

type WebAppOption = {
  id: string
  nama: string
  url: string
  skpd: { singkatan: string }
}

interface LaporanModalProps {
  isOpen: boolean
  onClose: () => void
  laporan?: Laporan | null
  webApps: WebAppOption[]
}

function formatDate(date: Date): string {
  return new Date(date).toISOString().split("T")[0]
}

export function LaporanModal({ isOpen, onClose, laporan, webApps }: LaporanModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buktiUrl, setBuktiUrl] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = !!laporan

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setBuktiUrl(laporan?.buktiUrl ?? null)
    }
  }, [isOpen, laporan])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    // Tambah buktiUrl ke formData
    if (buktiUrl) formData.set("buktiUrl", buktiUrl)

    const result = isEdit
      ? await updateLaporan(laporan.id, formData)
      : await createLaporan(formData)

    setIsLoading(false)
    if (!result.success) { setError(result.message); return }
    formRef.current?.reset()
    setBuktiUrl(null)
    onClose()
  }

  const inputClass = "w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Laporan" : "Tambah Laporan"} size="lg">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className={labelClass}>Jenis Kegiatan <span className="text-red-500">*</span></label>
          <input
            name="jenisKegiatan"
            defaultValue={laporan?.jenisKegiatan}
            required
            placeholder="Pembaruan konten, Perbaikan bug, Penambahan fitur, dll"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Domain Terkait <span className="text-red-500">*</span></label>
          <select name="webAppId" defaultValue={laporan?.webAppId} required className={inputClass}>
            <option value="">— Pilih Domain —</option>
            {webApps.map((w) => (
              <option key={w.id} value={w.id}>
                [{w.skpd.singkatan}] {w.nama} — {w.url}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Tanggal Kegiatan <span className="text-red-500">*</span></label>
          <input
            name="tanggal"
            type="date"
            defaultValue={laporan ? formatDate(laporan.tanggal) : new Date().toISOString().split("T")[0]}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Deskripsi Kegiatan <span className="text-red-500">*</span></label>
          <textarea
            name="deskripsi"
            defaultValue={laporan?.deskripsi}
            required
            rows={4}
            placeholder="Jelaskan kegiatan yang dilakukan secara detail..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Upload Bukti */}
        <div>
          <label className={labelClass}>
            Bukti Kegiatan
            <span className="ml-1 text-xs font-normal text-gray-400">(opsional)</span>
          </label>
          <ImageUpload
            value={buktiUrl}
            onChange={setBuktiUrl}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isLoading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Laporan"}
          </button>
        </div>
      </form>
    </Modal>
  )
}