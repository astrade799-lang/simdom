"use client"

import { useState, useEffect } from "react"
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

type HistoryItem = {
  id: string
  userName: string
  action: string
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: Date
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

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  UPDATE: { label: "Diperbarui", color: "bg-blue-100 text-blue-700" },
  DELETE: { label: "Dihapus", color: "bg-red-100 text-red-700" },
  CREATE: { label: "Dibuat", color: "bg-green-100 text-green-700" },
}

export function DomainDetailModal({ isOpen, onClose, domain }: DomainDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"detail" | "riwayat">("detail")
  const [histories, setHistories] = useState<HistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Load history saat tab riwayat dibuka
  useEffect(() => {
    if (activeTab === "riwayat" && domain?.id) {
      setLoadingHistory(true)
      fetch(`/api/domain/${domain.id}/history`)
        .then((r) => r.json())
        .then((data) => setHistories(data.histories ?? []))
        .catch(() => setHistories([]))
        .finally(() => setLoadingHistory(false))
    }
  }, [activeTab, domain?.id])

  // Reset tab saat modal dibuka
  useEffect(() => {
    if (isOpen) setActiveTab("detail")
  }, [isOpen])

  if (!domain) return null

  const statusInfo = {
    AKTIF: { bg: "bg-green-50 border-green-200", text: "text-green-800", icon: "✓", desc: "Domain berjalan normal dan dapat diakses." },
    TIDAK_AKTIF: { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", icon: "○", desc: "Domain saat ini tidak aktif." },
    SUSPEND: { bg: "bg-red-50 border-red-200", text: "text-red-800", icon: "!", desc: "Domain di-suspend dan tidak dapat diakses." },
  }

  const info = statusInfo[domain.status]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Domain" size="md">
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">{domain.nama}</h3>
            <a href={`https://${domain.url}`} target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs text-blue-600 hover:underline">
              {domain.url}
              <span className="ml-1 text-blue-400">↗</span>
            </a>
          </div>
          <StatusBadge status={domain.status} />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { key: "detail", label: "Detail" },
            { key: "riwayat", label: "Riwayat Perubahan" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "detail" | "riwayat")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Detail */}
        {activeTab === "detail" && (
          <div className="space-y-4">
            {/* Status box */}
            <div className={`rounded-xl border p-4 ${info.bg}`}>
              <div className="flex items-start gap-3">
                <span className={`text-lg font-bold ${info.text}`}>{info.icon}</span>
                <div>
                  <p className={`text-sm font-semibold ${info.text}`}>
                    {domain.status === "AKTIF" ? "Domain Aktif" :
                     domain.status === "TIDAK_AKTIF" ? "Domain Tidak Aktif" : "Domain Di-suspend"}
                  </p>
                  <p className={`text-sm mt-0.5 ${info.text} opacity-80`}>{info.desc}</p>

                  {domain.status === "SUSPEND" && domain.alasanSuspend && (
                    <div className="mt-2 rounded-lg bg-red-100/60 px-3 py-2">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Alasan Suspend</p>
                      <p className="text-sm text-red-800 mt-0.5">{domain.alasanSuspend}</p>
                    </div>
                  )}

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

            {/* Detail info grid */}
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
                <DetailRow label="Tanggal Expired" value={
                  <span className={new Date(domain.tanggalExpired) < new Date() ? "text-red-600 font-semibold" : ""}>
                    {formatDate(domain.tanggalExpired)}
                    {new Date(domain.tanggalExpired) < new Date() && " ⚠ Sudah expired"}
                  </span>
                } />
              )}
            </div>
          </div>
        )}

        {/* Tab: Riwayat */}
        {activeTab === "riwayat" && (
          <div className="min-h-[200px]">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              </div>
            ) : histories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <svg className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm text-gray-400">Belum ada riwayat perubahan</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {histories.map((h) => {
                  const actionConfig = ACTION_CONFIG[h.action] ?? { label: h.action, color: "bg-gray-100 text-gray-700" }
                  return (
                    <div key={h.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      {/* Header riwayat */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${actionConfig.color}`}>
                            {actionConfig.label}
                          </span>
                          <span className="text-xs font-medium text-gray-700">{h.userName}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">{formatDateTime(h.createdAt)}</span>
                      </div>

                      {/* Detail perubahan */}
                      {h.fieldName && (
                        <div className="rounded-lg bg-white border border-gray-100 px-3 py-2">
                          <p className="text-xs font-semibold text-gray-500 mb-1">{h.fieldName}</p>
                          <div className="flex items-center gap-2 text-xs">
                            {h.oldValue && (
                              <span className="line-through text-red-500">{h.oldValue}</span>
                            )}
                            {h.oldValue && h.newValue && (
                              <span className="text-gray-400">→</span>
                            )}
                            {h.newValue && (
                              <span className="text-green-700 font-medium">{h.newValue}</span>
                            )}
                            {!h.oldValue && !h.newValue && (
                              <span className="text-gray-400 italic">—</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <button onClick={onClose}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Tutup
        </button>
      </div>
    </Modal>
  )
}