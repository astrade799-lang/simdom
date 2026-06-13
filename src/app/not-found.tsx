"use client"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
          <svg className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
          </svg>
        </div>

        {/* 404 */}
        <h1 className="text-7xl font-bold text-blue-600 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-sm text-slate-500 mb-8">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          Kembali ke dashboard untuk melanjutkan.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            Ke Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Kembali
          </button>
        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-slate-400">
          SIMDOM · Diskominfo Kabupaten Soppeng
        </p>

      </div>
    </div>
  )
}