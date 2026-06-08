"use client"

import { useState, useRef } from "react"
import { Modal } from "@/components/ui/Modal"
import { createSkpd, updateSkpd } from "@/actions/skpd"

type Skpd = {
  id: string
  nama: string
  singkatan: string
  penanggungjawab: string
  kontak: string
}

interface SkpdModalProps {
  isOpen: boolean
  onClose: () => void
  skpd?: Skpd | null
}

export function SkpdModal({ isOpen, onClose, skpd }: SkpdModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = !!skpd

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = isEdit ? await updateSkpd(skpd.id, formData) : await createSkpd(formData)
    setIsLoading(false)
    if (!result.success) { setError(result.message); return }
    formRef.current?.reset()
    onClose()
  }

  const inputClass = "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit SKPD" : "Tambah SKPD"}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Nama Lengkap SKPD</label>
          <input name="nama" defaultValue={skpd?.nama} required placeholder="Dinas Komunikasi dan Informatika" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Singkatan</label>
          <input name="singkatan" defaultValue={skpd?.singkatan} required placeholder="DISKOMINFO" className={`${inputClass} uppercase`} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Penanggung Jawab</label>
          <input name="penanggungjawab" defaultValue={skpd?.penanggungjawab} required placeholder="Nama penanggung jawab" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Kontak</label>
          <input name="kontak" defaultValue={skpd?.kontak} required placeholder="0812-xxxx-xxxx" className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Batal
          </button>
          <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {isLoading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah SKPD"}
          </button>
        </div>
      </form>
    </Modal>
  )
}