"use client"

import { useState, useRef } from "react"
import { Modal } from "@/components/ui/Modal"
import { importDomains } from "@/actions/domain"
import * as XLSX from "xlsx"

type SkpdOption = { id: string; nama: string; singkatan: string }

interface ImportRow {
  nama: string
  url: string
  skpd: string
  status: string
  keterangan: string
  _valid: boolean
  _error: string
  _skpdId?: string
}

interface ImportDomainModalProps {
  isOpen: boolean
  onClose: () => void
  skpds: SkpdOption[]
}

export function ImportDomainModal({ isOpen, onClose, skpds }: ImportDomainModalProps) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload")
  const [rows, setRows] = useState<ImportRow[]>([])
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Map singkatan → id
  const skpdMap = Object.fromEntries(skpds.map((s) => [s.singkatan.toUpperCase(), s.id]))
  const validSkpd = skpds.map((s) => s.singkatan.toUpperCase())

  function handleClose() {
    setStep("upload")
    setRows([])
    setResult(null)
    setError(null)
    onClose()
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const wb = XLSX.read(data, { type: "binary" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" })

        if (json.length === 0) {
          setError("File Excel kosong atau format tidak sesuai template")
          return
        }

        // Parse dan validasi tiap baris
        const parsed: ImportRow[] = json.map((row) => {
          const nama = String(row["NAMA"] || "").trim()
          const url = String(row["URL"] || "").trim()
          const skpd = String(row["SKPD"] || "").trim().toUpperCase()
          const status = String(row["STATUS"] || "AKTIF").trim().toUpperCase()
          const keterangan = String(row["KETERANGAN"] || "").trim()

          const errors: string[] = []
          if (!nama) errors.push("NAMA kosong")
          if (!url) errors.push("URL kosong")
          if (!skpd) errors.push("SKPD kosong")
          else if (!validSkpd.includes(skpd)) errors.push(`SKPD "${skpd}" tidak dikenali`)

          const validStatus = ["AKTIF", "TIDAK_AKTIF", "SUSPEND"]
          if (status && !validStatus.includes(status)) errors.push(`STATUS "${status}" tidak valid`)

          return {
            nama, url,
            skpd: String(row["SKPD"] || "").trim(),
            status: validStatus.includes(status) ? status : "AKTIF",
            keterangan,
            _valid: errors.length === 0,
            _error: errors.join(", "),
            _skpdId: skpdMap[skpd],
          }
        })

        setRows(parsed)
        setStep("preview")
      } catch {
        setError("Gagal membaca file. Pastikan format sesuai template.")
      }
    }
    reader.readAsBinaryString(file)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r._valid)
    if (validRows.length === 0) return

    setStep("importing")

    const formData = new FormData()
    formData.append("data", JSON.stringify(validRows.map((r) => ({
      nama: r.nama,
      url: r.url,
      skpdId: r._skpdId,
      status: r.status,
      keterangan: r.keterangan,
    }))))

    const res = await importDomains(formData)
    setResult(res)
    setStep("done")
  }

  const validCount = rows.filter((r) => r._valid).length
  const invalidCount = rows.filter((r) => !r._valid).length

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Domain dari Excel" size="lg">
      <div className="space-y-4">

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Upload file Excel dengan format sesuai template. Domain yang sudah ada akan dilewati otomatis.
            </p>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Drop zone */}
            <div
              onClick={() => inputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">Klik untuk pilih file Excel</p>
                <p className="text-xs text-slate-400 mt-0.5">.xlsx atau .xls — Maks. 5MB</p>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFile}
            />

            {/* Download template */}
            <div className="flex items-center justify-center">
              
                <a href="/template_import_domain.xlsx"
                download
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download template Excel
              </a>
            </div>
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{rows.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total baris</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{validCount}</p>
                <p className="text-xs text-green-600 mt-0.5">Siap import</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{invalidCount}</p>
                <p className="text-xs text-red-500 mt-0.5">Ada error</p>
              </div>
            </div>

            {/* Preview table */}
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Status</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Nama</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">URL</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">SKPD</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Keterangan Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, i) => (
                    <tr key={i} className={row._valid ? "bg-white" : "bg-red-50"}>
                      <td className="px-3 py-2">
                        {row._valid ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700 font-medium">{row.nama || "—"}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono">{row.url || "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          row._valid ? "bg-blue-50 text-blue-600" : "bg-red-100 text-red-600"
                        }`}>
                          {row.skpd || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-red-500">{row._error || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invalidCount > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                ⚠ {invalidCount} baris akan dilewati karena ada error. Hanya {validCount} baris valid yang akan diimport.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ← Ganti File
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                Import {validCount} Domain
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Importing */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-500">Mengimport domain...</p>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === "done" && result && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-slate-800">Import Selesai!</p>
                <p className="text-sm text-slate-500 mt-1">
                  <span className="font-semibold text-green-600">{result.imported} domain</span> berhasil diimport
                  {result.skipped > 0 && `, ${result.skipped} dilewati (duplikat)`}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs font-semibold text-red-600 mb-1">Error:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-500">{e}</p>
                ))}
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Selesai
            </button>
          </div>
        )}

      </div>
    </Modal>
  )
}