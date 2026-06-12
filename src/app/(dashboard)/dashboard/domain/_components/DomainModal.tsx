"use client"

import { useState, useRef, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { createDomain, updateDomain } from "@/actions/domain"
import type { WebStatus } from "@prisma/client"

type WebApp = {
  id: string
  nama: string
  url: string
  status: WebStatus
  alasanSuspend: string | null
  keterangan: string | null  // ← tambahkan
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

interface DomainModalProps {
  isOpen: boolean
  onClose: () => void
  domain?: WebApp | null
  skpds: SkpdOption[]
}

function formatDate(date: Date | null): string {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

export function DomainModal({ isOpen, onClose, domain, skpds }: DomainModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<WebStatus>("AKTIF")
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = !!domain

  // Reset form state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setStatus(domain?.status ?? "AKTIF")
      setError(null)
    }
  }, [isOpen, domain])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = isEdit
      ? await updateDomain(domain.id, formData)
      : await createDomain(formData)

    setIsLoading(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    formRef.current?.reset()
    setStatus("AKTIF")
    onClose()
  }

  const inputClass = "w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Domain" : "Tambah Domain"} size="lg">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Nama Aplikasi / Website <span className="text-red-500">*</span></label>
            <input name="nama" defaultValue={domain?.nama} required placeholder="Website Dinas Kesehatan" className={inputClass} />
          </div>

          <div className="col-span-2">
            <label className={labelClass}>URL / Subdomain <span className="text-red-500">*</span></label>
            <input name="url" defaultValue={domain?.url} required placeholder="dinkes.soppeng.go.id" className={inputClass} />
          </div>

          <div className="col-span-2">
            <label className={labelClass}>SKPD <span className="text-red-500">*</span></label>
            <select name="skpdId" defaultValue={domain?.skpdId} required className={inputClass}>
              <option value="">— Pilih SKPD —</option>
              {skpds.map((s) => (
                <option key={s.id} value={s.id}>{s.singkatan} — {s.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Status <span className="text-red-500">*</span></label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as WebStatus)}
              className={inputClass}
            >
              <option value="AKTIF">Aktif</option>
              <option value="TIDAK_AKTIF">Tidak Aktif</option>
              <option value="SUSPEND">Suspend</option>
            </select>
          </div>

          <div>
  <label className={labelClass}>Platform <span className="text-gray-400 font-normal">(opsional)</span></label>
  <input name="platform" defaultValue={domain?.platform ?? ""} placeholder="WordPress, Laravel, dll" className={inputClass} />
</div>

{status === "SUSPEND" && (
  <div className="col-span-2">
    <label className={labelClass}>Alasan Suspend <span className="text-red-500">*</span></label>
    <input name="alasanSuspend" defaultValue={domain?.alasanSuspend ?? ""} required placeholder="Jelaskan alasan suspend..." className={inputClass} />
  </div>
)}

{/* ← TAMBAHKAN BLOK INI DI SINI */}
<div className="col-span-2">
  <label className={labelClass}>
    Keterangan Status{" "}
    <span className="text-gray-400 font-normal">
      {status === "SUSPEND"
        ? "(opsional — catatan tambahan)"
        : status === "TIDAK_AKTIF"
        ? "(opsional — jelaskan kenapa tidak aktif)"
        : "(opsional — catatan tentang domain ini)"}
    </span>
  </label>
  <textarea
    name="keterangan"
    defaultValue={domain?.keterangan ?? ""}
    rows={2}
    placeholder={
      status === "TIDAK_AKTIF"
        ? "Contoh: Kontrak berakhir, menunggu perpanjangan..."
        : status === "SUSPEND"
        ? "Catatan tambahan selain alasan suspend..."
        : "Catatan tambahan tentang domain ini..."
    }
    className={`${inputClass} resize-none`}
  />
</div>

<div>
  <label className={labelClass}>Admin Teknis <span className="text-red-500">*</span></label>
  <input name="adminTeknis" defaultValue={domain?.adminTeknis === "-" ? "" : domain?.adminTeknis} required placeholder="Nama admin teknis" className={inputClass} />
</div>

          <div>
            <label className={labelClass}>Kontak Admin <span className="text-red-500">*</span></label>
            <input name="kontakAdmin" defaultValue={domain?.kontakAdmin === "-" ? "" : domain?.kontakAdmin} required placeholder="0812-xxxx-xxxx" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Vendor <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input name="vendor" defaultValue={domain?.vendor ?? ""} placeholder="Nama vendor" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Kontak Vendor <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input name="kontakVendor" defaultValue={domain?.kontakVendor ?? ""} placeholder="0812-xxxx-xxxx" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Tanggal Aktif <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input name="tanggalAktif" type="date" defaultValue={formatDate(domain?.tanggalAktif ?? null)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Tanggal Expired <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input name="tanggalExpired" type="date" defaultValue={formatDate(domain?.tanggalExpired ?? null)} className={inputClass} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Batal
          </button>
          <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {isLoading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Domain"}
          </button>
        </div>
      </form>
    </Modal>
  )
}