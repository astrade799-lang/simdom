"use client"

import { Modal } from "@/components/ui/Modal"
import { StatusBadge } from "@/components/ui/Badge"
import type { WebStatus } from "@prisma/client"

type WebApp = {
  id: string
  nama: string
  url: string
  status: WebStatus
  alasanSuspend: string | null
  keterangan: string | null
  adminTeknis: string
  kontakAdmin: string
  vendor: string | null
  kontakVendor: string | null
  platform: string | null
  tanggalAktif: Date | null
  tanggalExpired: Date | null
  skpd: { nama: string; singkatan: string }
}

interface DomainDetailModalProps {
  isOpen: boolean
  onClose: () => void
  domain: WebApp | null
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  )
}

function formatDate(date: Date | null): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

export function DomainDetailModal({ isOpen, onClose, domain }: DomainDetailModalProps) {
  if (!domain) return null

  const statusInfo = {
    AKTIF: { bg: "bg-green-50 border-green-200", text: "text-green-800", icon: "✓", desc: "Domain berjalan normal dan dapat diakses." },
    TIDAK_AKTIF: { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", icon: "○", desc: "Domain saat ini tidak aktif." },
    SUSPEND: { bg: "bg-red-50 border-red-200", text: "text-red-800", icon: "!", desc: "Domain di-suspend dan tidak dapat diakses." },
  }

  const info = statusInfo[domain.status]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Domain" size="md">
      <div className="space-y-5">

        {/* Header info */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">{domain.nama}</h3>
            <a href={`https://${domain.url}`}
  target="_blank"
  rel="noopener noreferrer"
  className="font-mono text-xs text-blue-600 hover:underline"
>
  {domain.url}
  <span className="ml-1 text-blue-400">↗</span>
</a>
          </div>
          <StatusBadge status={domain.status} />
        </div>

        {/* Status explanation box */}
        <div className={`rounded-xl border p-4 ${info.bg}`}>
          <div className="flex items-start gap-3">
            <span className={`text-lg font-bold ${info.text}`}>{info.icon}</span>
            <div>
              <p className={`text-sm font-semibold ${info.text}`}>
                {domain.status === "AKTIF" ? "Domain Aktif" :
                 domain.status === "TIDAK_AKTIF" ? "Domain Tidak Aktif" : "Domain Di-suspend"}
              </p>
              <p className={`text-sm mt-0.5 ${info.text} opacity-80`}>{info.desc}</p>

              {/* Alasan suspend */}
              {domain.status === "SUSPEND" && domain.alasanSuspend && (
                <div className="mt-2 rounded-lg bg-red-100/60 px-3 py-2">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Alasan Suspend</p>
                  <p className="text-sm text-red-800 mt-0.5">{domain.alasanSuspend}</p>
                </div>
              )}

              {/* Keterangan */}
              {domain.keterangan && (
                <div className={`mt-2 rounded-lg px-3 py-2 ${
                  domain.status === "SUSPEND" ? "bg-red-100/40" :
                  domain.status === "TIDAK_AKTIF" ? "bg-gray-100" : "bg-green-100/40"
                }`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${info.text} opacity-70`}>Keterangan</p>
                  <p className={`text-sm mt-0.5 ${info.text}`}>{domain.keterangan}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail info */}
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="SKPD" value={
            <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {domain.skpd.singkatan}
            </span>
          } />
          {domain.platform && <DetailRow label="Platform" value={domain.platform} />}
          <DetailRow label="Admin Teknis" value={domain.adminTeknis !== "-" ? domain.adminTeknis : null} />
          <DetailRow label="Kontak Admin" value={domain.kontakAdmin !== "-" ? domain.kontakAdmin : null} />
          {domain.vendor && <DetailRow label="Vendor" value={domain.vendor} />}
          {domain.kontakVendor && <DetailRow label="Kontak Vendor" value={domain.kontakVendor} />}
          {domain.tanggalAktif && <DetailRow label="Tanggal Aktif" value={formatDate(domain.tanggalAktif)} />}
          {domain.tanggalExpired && (
            <DetailRow
              label="Tanggal Expired"
              value={
                <span className={new Date(domain.tanggalExpired) < new Date() ? "text-red-600 font-semibold" : ""}>
                  {formatDate(domain.tanggalExpired)}
                  {new Date(domain.tanggalExpired) < new Date() && " ⚠ Sudah expired"}
                </span>
              }
            />
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Tutup
        </button>
      </div>
    </Modal>
  )
}