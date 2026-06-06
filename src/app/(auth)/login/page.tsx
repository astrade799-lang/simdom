import { LoginForm } from "@/components/auth/LoginForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login — SIMDOM",
  description: "Sistem Informasi Manajemen Domain Diskominfo Soppeng",
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <span className="text-xl font-bold text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SIMDOM</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sistem Informasi Manajemen Domain
          </p>
          <p className="text-xs text-gray-400">
            Diskominfo Kabupaten Soppeng
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-gray-800">
            Masuk ke akun Anda
          </h2>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Diskominfo Kabupaten Soppeng
        </p>

      </div>
    </main>
  )
}