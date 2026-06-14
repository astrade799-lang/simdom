import { LoginForm } from "@/components/auth/LoginForm"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Login — SIMDOM",
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex">

      {/* Left — Dark Brand Panel */}
      <div className="hidden lg:flex lg:w-[420px] flex-col justify-between bg-slate-900 p-10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <span className="text-sm font-semibold text-white">SIMDOM</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-white leading-snug">
              Sistem Informasi<br/>Manajemen Domain
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Platform terpadu untuk mengelola dan memantau seluruh
              domain soppeng.go.id lintas SKPD.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "SKPD", value: "33" },
              { label: "Domain", value: "111+" },
              { label: "Aktif", value: "111" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-800 p-3 text-center">
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            {[
              "Manajemen domain & subdomain",
              "Laporan aktivitas harian",
              "Konfirmasi & instruksi Kabid",
              "Manajemen user & role",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="h-1 w-1 rounded-full bg-blue-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-slate-600">
          © {new Date().getFullYear()} Dinas Komunikasi dan Informatika Kabupaten Soppeng
        </p>
      </div>

      {/* Right — Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-[340px]">

          {/* Mobile brand */}
          <div className="mb-8 lg:hidden text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 mb-3">
              <span className="text-base font-bold text-white">S</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">SIMDOM</h1>
            <p className="text-sm text-slate-500">Diskominfo Kabupaten Soppeng</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">Masuk</h2>
              <p className="text-xs text-slate-400 mt-1">Gunakan akun yang telah diberikan</p>
            </div>
            <LoginForm />
          </div>

          <p className="mt-5 text-center text-[11px] text-slate-400">
            SIMDOM v1.0 · Diskominfo Soppeng
          </p>
        </div>
      </div>

    </main>
  )
}