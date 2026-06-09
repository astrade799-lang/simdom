"use client"

import { useState, useRef } from "react"
import { Modal } from "@/components/ui/Modal"
import { resetPassword } from "@/actions/user"

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
}

export function ResetPasswordModal({ isOpen, onClose, userId, userName }: ResetPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    const confirm = formData.get("confirmPassword") as string
    if (password !== confirm) { setError("Konfirmasi password tidak cocok"); return }
    setIsLoading(true)
    const result = await resetPassword(userId, formData)
    setIsLoading(false)
    if (!result.success) { setError(result.message); return }
    formRef.current?.reset()
    onClose()
  }

  const inputClass = "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password" size="sm">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <p className="text-sm text-gray-500">
          Reset password untuk akun <strong className="text-gray-800">{userName}</strong>
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru <span className="text-red-500">*</span></label>
          <input name="password" type="password" required placeholder="Minimal 8 karakter" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password <span className="text-red-500">*</span></label>
          <input name="confirmPassword" type="password" required placeholder="Ulangi password baru" className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
          <button type="submit" disabled={isLoading} className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
            {isLoading ? "Menyimpan..." : "Reset Password"}
          </button>
        </div>
      </form>
    </Modal>
  )
}