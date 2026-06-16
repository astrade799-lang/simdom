"use client"

import { useState, useRef, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { createUser, updateUser } from "@/actions/user"
import type { Role } from "@prisma/client"

type User = {
  id: string
  name: string
  namaLengkap: string | null  // ← TAMBAH
  nip: string | null          // ← TAMBAH
  email: string
  role: Role
  skpdId: string | null
}

type SkpdOption = { id: string; nama: string; singkatan: string }

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: User | null
  skpds: SkpdOption[]
}

export function UserModal({ isOpen, onClose, user, skpds }: UserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = !!user

  useEffect(() => {
    if (isOpen) setError(null)
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = isEdit ? await updateUser(user.id, formData) : await createUser(formData)
    setIsLoading(false)
    if (!result.success) { setError(result.message); return }
    formRef.current?.reset()
    onClose()
  }

  const inputClass = "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit User" : "Tambah User"}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Username / display name */}
        <div>
          <label className={labelClass}>Username <span className="text-red-500">*</span></label>
          <input
            name="name"
            defaultValue={user?.name}
            required
            placeholder="Username untuk login"
            className={inputClass}
          />
        </div>

        {/* Nama Lengkap */}
        <div>
          <label className={labelClass}>
            Nama Lengkap
            <span className="ml-1 text-xs font-normal text-gray-400">(untuk laporan)</span>
          </label>
          <input
            name="namaLengkap"
            defaultValue={user?.namaLengkap ?? ""}
            placeholder="Nama lengkap sesuai jabatan"
            className={inputClass}
          />
        </div>

        {/* NIP */}
        <div>
          <label className={labelClass}>
            NIP
            <span className="ml-1 text-xs font-normal text-gray-400">(untuk laporan)</span>
          </label>
          <input
            name="nip"
            defaultValue={user?.nip ?? ""}
            placeholder="Nomor Induk Pegawai"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Email <span className="text-red-500">*</span></label>
          <input
            name="email"
            type="email"
            defaultValue={user?.email}
            required
            placeholder="email@soppeng.go.id"
            className={inputClass}
          />
        </div>

        {!isEdit && (
          <div>
            <label className={labelClass}>Password <span className="text-red-500">*</span></label>
            <input
              name="password"
              type="password"
              required
              placeholder="Minimal 8 karakter"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className={labelClass}>Role <span className="text-red-500">*</span></label>
          <select name="role" defaultValue={user?.role ?? "ADMIN"} required className={inputClass}>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="KABID">Kabid / Kasubag</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>SKPD <span className="text-gray-400 font-normal">(opsional)</span></label>
          <select name="skpdId" defaultValue={user?.skpdId ?? ""} className={inputClass}>
            <option value="">— Tidak ada —</option>
            {skpds.map((s) => (
              <option key={s.id} value={s.id}>{s.singkatan} — {s.nama}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Batal
          </button>
          <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {isLoading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah User"}
          </button>
        </div>
      </form>
    </Modal>
  )
}