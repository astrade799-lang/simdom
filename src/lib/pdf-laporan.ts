import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { ActivityStatus } from "@prisma/client"

type LaporanItem = {
  jenisKegiatan: string
  tanggal: Date
  status: ActivityStatus
  instruksi: string | null
  buktiUrl?: string | null  // ← TAMBAH
  webApp: {
    nama: string
    url: string
    skpd: { nama: string; singkatan: string }
  }
}

const STATUS_LABEL: Record<ActivityStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Dikonfirmasi",
  INSTRUCTED: "Diberi Instruksi",
}

type KabidInfo = {
  namaLengkap: string | null
  nip: string | null
  name: string
} | null

type UserInfo = {
  namaLengkap: string | null
  nip: string | null
  name: string
} | null

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// Ambil dimensi asli gambar agar tidak gepeng saat di-render
function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 800, height: 600 })
    img.src = base64
  })
}

export async function generateLaporanPDF(
  laporans: LaporanItem[],
  periode: string,
  totalDomain: number,
  kabid: UserInfo = null,
  pembuat: UserInfo = null,
  orientation: "portrait" | "landscape" = "portrait",
  format: "a4" | "f4" = "a4"
) {
  const paperFormat = format === "f4" ? [215.9, 330.2] : "a4"

  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: paperFormat,
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20  // ← PASTIKAN INI ADA SEBELUM doc.line()

  // ── LOAD LOGO ──
  let logoData: string | null = null
  try {
    const response = await fetch("/logo_soppeng.png")
    const blob = await response.blob()
    logoData = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    console.warn("Logo tidak bisa dimuat, lanjut tanpa logo")
  }

  // ── KOP DINAS ──────────────────────────────────────────────
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(margin, 14, pageWidth - margin, 14)

  // Logo kiri — hanya tampil kalau berhasil load
  if (logoData) {
    doc.addImage(logoData, "PNG", margin, 18, 20, 20)
  }

  // Teks kop tengah
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("PEMERINTAH KABUPATEN SOPPENG", pageWidth / 2, 21, { align: "center" })

  doc.setFontSize(13)
  doc.text("DINAS KOMUNIKASI DAN INFORMATIKA", pageWidth / 2, 29, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(
    "Alamat : Kantor Bupati Soppeng Jln.Salotungo. No. ... Telp/Fax. (0484) 23018,",
    pageWidth / 2, 34, { align: "center" }
  )
  doc.text(
    "Email : diskominfo@soppeng.go.id  Watansoppeng, 90812",
    pageWidth / 2, 38, { align: "center" }
  )

  // Garis bawah kop double
  doc.setLineWidth(1)
  doc.line(margin, 42, pageWidth - margin, 42)
  doc.setLineWidth(0.3)
  doc.line(margin, 44, pageWidth - margin, 44)

  // ── JUDUL ───────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("LAPORAN AKTIVITAS PENGELOLAAN DOMAIN", pageWidth / 2, 54, { align: "center" })
  doc.text(`KABUPATEN SOPPENG`, pageWidth / 2, 60, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Periode: ${periode}`, pageWidth / 2, 67, { align: "center" })

  // Garis bawah judul
  doc.setLineWidth(0.3)
  doc.line(margin, 70, pageWidth - margin, 70)

  // ── INFO RINGKAS ─────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  })

  doc.setFontSize(9)
  doc.text(`Tanggal Cetak : ${today}`, margin, 77)
  doc.text(`Total Laporan : ${laporans.length} kegiatan`, margin, 82)
  doc.text(`Total Domain  : ${totalDomain} domain terdaftar`, margin, 87)

  // ── TABEL ────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 93,
    margin: { left: margin, right: margin },
    head: [["No", "Jenis Kegiatan", "Domain / SKPD", "Tanggal", "Status", "Instruksi"]],
    body: laporans.map((lap, i) => [
      i + 1,
      lap.jenisKegiatan,
      `${lap.webApp.nama}\n(${lap.webApp.skpd.singkatan})`,
      new Date(lap.tanggal).toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric",
      }),
      STATUS_LABEL[lap.status],
      lap.instruksi ?? "-",
    ]),
    headStyles: {
      fillColor: [29, 78, 216],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 42 },
      2: { cellWidth: 38 },
      3: { cellWidth: 24, halign: "center" },
      4: { cellWidth: 24, halign: "center" },
      5: { cellWidth: 34 },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didDrawPage: (data) => {
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(
        `Halaman ${data.pageNumber}  —  SIMDOM Diskominfo Kabupaten Soppeng`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      )
    },
  })

// ── TANDA TANGAN ─────────────────────────────────────────────────
const finalY = (doc as any).lastAutoTable.finalY + 12
const hasTTD = kabid !== null || pembuat !== null

if (hasTTD && finalY < doc.internal.pageSize.getHeight() - 60) {
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")

  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  })

  // ── Kiri: Yang Membuat (hanya kalau pembuat tidak null) ──
  if (pembuat !== null) {
    const leftX = margin + 30
    doc.text("Yang Membuat,", leftX, finalY, { align: "center" })
    doc.setDrawColor(100)
    doc.setLineWidth(0.3)
    doc.line(leftX - 25, finalY + 25, leftX + 25, finalY + 25)

    const namaPembuat = pembuat?.namaLengkap || pembuat?.name || "___________________"
    const nipPembuat = pembuat?.nip || "___________________"

    doc.setFont("helvetica", "bold")
    doc.text(namaPembuat, leftX, finalY + 30, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.text(`NIP. ${nipPembuat}`, leftX, finalY + 35, { align: "center" })
  }

  // ── Kanan: Mengetahui (hanya kalau kabid tidak null) ──
  if (kabid !== null) {
    const rightX = pageWidth - margin - 30
    doc.setFont("helvetica", "normal")
    doc.text(`Watansoppeng, ${today}`, rightX, finalY, { align: "center" })
    doc.text("Mengetahui,", rightX, finalY + 5, { align: "center" })
    doc.text("Kepala Bidang / Kabid", rightX, finalY + 9, { align: "center" })
    doc.text("Diskominfo Kabupaten Soppeng,", rightX, finalY + 13, { align: "center" })

    doc.setDrawColor(100)
    doc.setLineWidth(0.3)
    doc.line(rightX - 30, finalY + 32, rightX + 30, finalY + 32)

    const namaKabid = kabid?.namaLengkap || kabid?.name || "___________________"
    const nipKabid = kabid?.nip || "___________________"

    doc.setFont("helvetica", "bold")
    doc.text(namaKabid, rightX, finalY + 37, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.text(`NIP. ${nipKabid}`, rightX, finalY + 42, { align: "center" })
  }
}

// ── LAMPIRAN FOTO BUKTI KEGIATAN ──────────────────────────────────
  const laporansWithPhoto = laporans.filter((l) => l.buktiUrl)

  if (laporansWithPhoto.length > 0) {
    for (let i = 0; i < laporansWithPhoto.length; i++) {
      const lap = laporansWithPhoto[i]
      doc.addPage()

      // Header halaman lampiran
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.text("LAMPIRAN FOTO BUKTI KEGIATAN", pageWidth / 2, 18, { align: "center" })

      doc.setLineWidth(0.3)
      doc.setDrawColor(200)
      doc.line(margin, 22, pageWidth - margin, 22)

      // ── Info kegiatan (sinkron dengan tabel laporan) ──
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text(`${i + 1}. ${lap.jenisKegiatan}`, margin, 32)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.text(`Domain    : ${lap.webApp.nama} (${lap.webApp.skpd.singkatan})`, margin, 39)
      doc.text(`Tanggal   : ${new Date(lap.tanggal).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
      })}`, margin, 45)
      doc.text(`Status    : ${STATUS_LABEL[lap.status]}`, margin, 51)

      if (lap.instruksi) {
        doc.text(`Instruksi : ${lap.instruksi}`, margin, 57)
      }

      // Garis pemisah sebelum foto
      doc.setLineWidth(0.2)
      doc.setDrawColor(220)
      doc.line(margin, 63, pageWidth - margin, 63)

      // ── Load & tampilkan foto ──
      try {
        const photoData = await loadImageAsBase64(lap.buktiUrl!)

        if (photoData) {
          const { width: imgW, height: imgH } = await getImageDimensions(photoData)
          const aspectRatio = imgW / imgH

          // Area maksimal foto di halaman
          const maxWidth = pageWidth - margin * 2
          const maxHeight = doc.internal.pageSize.getHeight() - 100 // sisakan ruang bawah

          let drawWidth = maxWidth
          let drawHeight = drawWidth / aspectRatio

          if (drawHeight > maxHeight) {
            drawHeight = maxHeight
            drawWidth = drawHeight * aspectRatio
          }

          const drawX = (pageWidth - drawWidth) / 2
          const drawY = 70

          // Border foto
          doc.setDrawColor(220)
          doc.setLineWidth(0.3)
          doc.rect(drawX - 1, drawY - 1, drawWidth + 2, drawHeight + 2)

          doc.addImage(photoData, "JPEG", drawX, drawY, drawWidth, drawHeight)

          // Caption di bawah foto
          doc.setFont("helvetica", "italic")
          doc.setFontSize(8)
          doc.setTextColor(120)
          doc.text(
            `Foto bukti kegiatan: ${lap.jenisKegiatan}`,
            pageWidth / 2,
            drawY + drawHeight + 8,
            { align: "center" }
          )
          doc.setTextColor(0)
        } else {
          doc.setFont("helvetica", "italic")
          doc.setFontSize(9)
          doc.setTextColor(150)
          doc.text("(Foto tidak dapat dimuat)", pageWidth / 2, 100, { align: "center" })
          doc.setTextColor(0)
        }
      } catch {
        doc.setFont("helvetica", "italic")
        doc.setFontSize(9)
        doc.setTextColor(150)
        doc.text("(Foto tidak dapat dimuat)", pageWidth / 2, 100, { align: "center" })
        doc.setTextColor(0)
      }

      // Footer halaman lampiran
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(
        `Lampiran ${i + 1} dari ${laporansWithPhoto.length}  —  SIMDOM Diskominfo Kabupaten Soppeng`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      )
      doc.setTextColor(0)
    }
  }

  // ── SAVE ─────────────────────────────────────────────────────────
  const filename = `Laporan_Aktivitas_${periode.replace(/\s+/g, "_")}_SIMDOM.pdf`
  doc.save(filename)
}

