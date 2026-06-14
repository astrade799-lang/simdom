"use client"

import { Modal } from "@/components/ui/Modal"
import { ActivityBadge } from "@/components/ui/Badge"
import Image from "next/image"
import type { ActivityStatus } from "@prisma/client"

type LaporanDetail = {
  id: string
  jenisKegiatan: string
  deskripsi: string
  tanggal: Date
  status: ActivityStatus
  instruksi: string | null
  buktiUrl?: string | null
  webAppId: string
  webApp: {
    nama: string
    url: string
    skpd: { nama: string; singkatan: string }
  }
}

interface LaporanDetailModalProps {
  isOpen: boolean
  onClose: () => void
  laporan: LaporanDetail | null
}

export function LaporanDetailModal({ isOpen, onClose, laporan }: LaporanDetailModalProps) {
  if (!laporan) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Laporan" size="lg">
      <div className="space-y-5">

        {/* Status */}
        <div className="flex items-center justify-between">
          <ActivityBadge status={laporan.status} />
          <span className="text-xs text-slate-400">
            {new Date(laporan.tanggal).toLocaleDateString("id-ID", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </span>
        </div>

        {/* Jenis Kegiatan */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Jenis Kegiatan</p>
          <p className="text-sm font-semibold text-slate-900">{laporan.jenisKegiatan}</p>
        </div>

        {/* Domain */}
        <div className="rounded-xl bg-slate-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Domain Terkait</p>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
              {laporan.webApp.skpd.singkatan}
            </span>
            <span className="text-sm font-medium text-slate-800">{laporan.webApp.nama}</span>
          </div>
          
            <a href={`https://${laporan.webApp.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            {laporan.webApp.url}
          </a>
        </div>

        {/* Deskripsi */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Deskripsi Kegiatan</p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{laporan.deskripsi}</p>
        </div>

        {/* Instruksi (kalau ada) */}
        {laporan.instruksi && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400 mb-1">Instruksi Kabid</p>
            <p className="text-sm text-blue-800 leading-relaxed">{laporan.instruksi}</p>
          </div>
        )}

        {/* Bukti Gambar */}
        {laporan.buktiUrl ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Bukti Kegiatan</p>
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <Image
                src={laporan.buktiUrl}
                alt="Bukti kegiatan"
                width={800}
                height={500}
                className="w-full object-contain max-h-80"
              />
            </div>
            
              <a href={laporan.buktiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              Buka gambar di tab baru
            </a>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-400">Tidak ada bukti gambar dilampirkan</p>
          </div>
        )}

        {/* Tombol tutup */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </Modal>
  )
}