"use client"

import { useState, useRef } from "react"
import { Modal } from "@/components/ui/Modal"
import { createAudit } from "@/actions/audit"

type WebAppOption = { id: string; nama: string; url: string }

interface AuditModalProps {
  isOpen: boolean
  onClose: () => void
  domain: WebAppOption | null
}

type Grade = "BAIK" | "SEDANG" | "BURUK" | "BELUM_CEK"

const GRADE_CONFIG: Record<Grade, { label: string; color: string; dot: string }> = {
  BAIK:      { label: "🟢 Baik",      color: "border-green-500 bg-green-50 text-green-700",  dot: "bg-green-500" },
  SEDANG:    { label: "🟡 Sedang",    color: "border-yellow-500 bg-yellow-50 text-yellow-700", dot: "bg-yellow-500" },
  BURUK:     { label: "🔴 Buruk",     color: "border-red-500 bg-red-50 text-red-700",         dot: "bg-red-500" },
  BELUM_CEK: { label: "⚪ Belum Cek", color: "border-gray-300 bg-gray-50 text-gray-500",      dot: "bg-gray-300" },
}

function GradeSelector({ name, value, onChange }: {
  name: string
  value: Grade
  onChange: (v: Grade) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {(Object.keys(GRADE_CONFIG) as Grade[]).map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={`rounded-lg border-2 px-2 py-1.5 text-xs font-medium transition-all ${
            value === g ? GRADE_CONFIG[g].color + " border-2" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {GRADE_CONFIG[g].label}
        </button>
      ))}
      <input type="hidden" name={name} value={value} />
    </div>
  )
}

export function AuditModal({ isOpen, onClose, domain }: AuditModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [perfGrade, setPerfGrade] = useState<Grade>("BELUM_CEK")
  const [secGrade, setSecGrade] = useState<Grade>("BELUM_CEK")
  const [dnsGrade, setDnsGrade] = useState<Grade>("BELUM_CEK")
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createAudit(formData)
    setIsLoading(false)
    if (!result.success) { setError(result.message); return }
    formRef.current?.reset()
    setPerfGrade("BELUM_CEK")
    setSecGrade("BELUM_CEK")
    setDnsGrade("BELUM_CEK")
    onClose()
  }

  if (!domain) return null

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
  const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5"
  const sectionClass = "rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Form Audit Teknis Domain" size="lg">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="webAppId" value={domain.id} />

        {/* Info Domain */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-sm font-semibold text-blue-800">{domain.nama}</p>
          <a href={`https://${domain.url}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline font-mono">{domain.url} ↗</a>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Performance */}
        <div className={sectionClass}>
          <div>
            <p className={labelClass}>🚀 Performance (PageSpeed / GTmetrix)</p>
            <GradeSelector name="performanceGrade" value={perfGrade} onChange={setPerfGrade} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Skor (0-100)</label>
              <input name="performanceScore" type="number" min="0" max="100"
                placeholder="mis: 72" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Link Hasil</label>
              <input name="performanceLink" type="url"
                placeholder="https://pagespeed.web.dev/..." className={inputClass} />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className={sectionClass}>
          <div>
            <p className={labelClass}>🛡️ Keamanan (Security Headers / Mozilla Observatory)</p>
            <GradeSelector name="securityGrade" value={secGrade} onChange={setSecGrade} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Grade (A+/A/B/C/D/F)</label>
              <input name="securityScore" placeholder="mis: B" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Link Hasil</label>
              <input name="securityLink" type="url"
                placeholder="https://securityheaders.com/..." className={inputClass} />
            </div>
          </div>
        </div>

        {/* DNS/Email */}
        <div className={sectionClass}>
          <div>
            <p className={labelClass}>📧 Email/DNS (MXToolbox)</p>
            <GradeSelector name="dnsGrade" value={dnsGrade} onChange={setDnsGrade} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Status</label>
              <select name="dnsStatus" className={inputClass}>
                <option value="">— Pilih —</option>
                <option value="OK">✅ OK</option>
                <option value="Warning">⚠️ Warning</option>
                <option value="Error">❌ Error</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Link Hasil</label>
              <input name="dnsLink" type="url"
                placeholder="https://mxtoolbox.com/..." className={inputClass} />
            </div>
          </div>
        </div>

        {/* Teknologi & Catatan */}
        {/* Teknologi & Catatan — lebih luas */}
<div className="space-y-3">
  <div>
    <label className={labelClass}>🔧 Teknologi (Wappalyzer)</label>
    <textarea
      name="teknologi"
      rows={3}
      placeholder="mis: WordPress 6.4, PHP 8.1, MySQL, Apache&#10;Atau teknologi lain yang terdeteksi Wappalyzer"
      className={`${inputClass} resize-none`}
    />
  </div>
  <div>
    <label className={labelClass}>📝 Catatan Umum</label>
    <textarea
      name="catatanUmum"
      rows={4}
      placeholder="Temuan, rekomendasi, atau catatan penting lainnya..."
      className={`${inputClass} resize-none`}
    />
  </div>
</div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Batal
          </button>
          <button type="submit" disabled={isLoading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {isLoading ? "Menyimpan..." : "Simpan Hasil Audit"}
          </button>
        </div>
      </form>
    </Modal>
  )
}