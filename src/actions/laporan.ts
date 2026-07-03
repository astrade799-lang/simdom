"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { laporanSchema } from "@/lib/validations/laporan"
import { revalidatePath } from "next/cache"
import { sendEmailLaporanBaru, sendEmailStatusLaporan } from "@/lib/email"

type ActionResult = { success: boolean; message: string }

function handleError(error: unknown): ActionResult {
  console.error("[Laporan Action Error]:", error)
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return { success: false, message: "Silakan login terlebih dahulu" }
    if (error.message === "FORBIDDEN") return { success: false, message: "Anda tidak memiliki akses" }
    if ((error as any).code === "P2025") return { success: false, message: "Data tidak ditemukan" }
    return { success: false, message: error.message }
  }
  return { success: false, message: String(error) }
}

async function requireAdminOrAbove() {
  const session = await auth()
  if (!session) throw new Error("UNAUTHORIZED")
  if (session.user.role === "KABID") throw new Error("FORBIDDEN")
  return session
}

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error("UNAUTHORIZED")
  return session
}

export async function createLaporan(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdminOrAbove()
    const raw = {
      jenisKegiatan: formData.get("jenisKegiatan") as string,
      deskripsi: formData.get("deskripsi") as string,
      tanggal: formData.get("tanggal") as string,
      webAppId: formData.get("webAppId") as string,
    }
    const validated = laporanSchema.safeParse(raw)
    if (!validated.success) {
      return { success: false, message: validated.error.issues[0]?.message ?? "Validasi gagal" }
    }

    // ✅ Ambil data domain + SKPD sekaligus untuk email
    const laporan = await prisma.activityReport.create({
      data: {
        jenisKegiatan: validated.data.jenisKegiatan,
        deskripsi: validated.data.deskripsi,
        tanggal: new Date(validated.data.tanggal),
        webAppId: validated.data.webAppId,
        createdById: session.user.id,
        buktiUrl: (formData.get("buktiUrl") as string) || null,
      },
      include: {
        webApp: {
          select: {
            nama: true,
            skpd: { select: { singkatan: true } },
          },
        },
      },
    })

    // ✅ Kirim email ke semua Kabid (fire and forget)
    prisma.user.findMany({
      where: { role: "KABID" },
      select: { email: true, name: true, namaLengkap: true },
    }).then((kabids) => {
      kabids.forEach((kabid) => {
        sendEmailLaporanBaru({
          kabidEmail: kabid.email,
          kabidName: kabid.namaLengkap ?? kabid.name,
          jenisKegiatan: laporan.jenisKegiatan,
          domainNama: laporan.webApp.nama,
          skpdSingkatan: laporan.webApp.skpd.singkatan,
          pembuatName: session.user.name ?? "Admin",
          tanggal: laporan.tanggal,
          laporanId: laporan.id,
        })
      })
    }).catch((e) => console.error("[EMAIL] Gagal kirim notif Kabid:", e))

    revalidatePath("/dashboard/laporan")
    revalidatePath("/dashboard")
    return { success: true, message: "Laporan berhasil ditambahkan" }
  } catch (error) {
    return handleError(error)
  }
}

export async function updateLaporan(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminOrAbove()
    const raw = {
      jenisKegiatan: formData.get("jenisKegiatan") as string,
      deskripsi: formData.get("deskripsi") as string,
      tanggal: formData.get("tanggal") as string,
      webAppId: formData.get("webAppId") as string,
    }
    const validated = laporanSchema.safeParse(raw)
    if (!validated.success) {
      return { success: false, message: validated.error.issues[0]?.message ?? "Validasi gagal" }
    }
    const existing = await prisma.activityReport.findUnique({ where: { id } })
    if (!existing) return { success: false, message: "Laporan tidak ditemukan" }
    if (existing.status !== "PENDING") return { success: false, message: "Laporan yang sudah dikonfirmasi tidak bisa diedit" }

    await prisma.activityReport.update({
      where: { id },
      data: {
        jenisKegiatan: validated.data.jenisKegiatan,
        deskripsi: validated.data.deskripsi,
        tanggal: new Date(validated.data.tanggal),
        webAppId: validated.data.webAppId,
        buktiUrl: (formData.get("buktiUrl") as string) || null,
      },
    })
    revalidatePath("/dashboard/laporan")
    return { success: true, message: "Laporan berhasil diperbarui" }
  } catch (error) {
    return handleError(error)
  }
}

export async function deleteLaporan(id: string): Promise<ActionResult> {
  try {
    await requireAdminOrAbove()
    await prisma.activityReport.delete({ where: { id } })
    revalidatePath("/dashboard/laporan")
    revalidatePath("/dashboard")
    return { success: true, message: "Laporan berhasil dihapus" }
  } catch (error) {
    return handleError(error)
  }
}

export async function konfirmasiLaporan(id: string): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    if (session.user.role === "ADMIN") throw new Error("FORBIDDEN")

    // ✅ Ambil data pembuat untuk kirim email
    const laporan = await prisma.activityReport.update({
      where: { id },
      data: { status: "CONFIRMED", confirmedById: session.user.id, instruksi: null },
      include: {
        webApp: { select: { nama: true } },
        createdBy: { select: { email: true, name: true, namaLengkap: true } },
      },
    })

    // ✅ Kirim email ke pembuat (fire and forget)
    if (laporan.createdBy?.email) {
      sendEmailStatusLaporan({
        pembuatEmail: laporan.createdBy.email,
        pembuatName: laporan.createdBy.namaLengkap ?? laporan.createdBy.name,
        jenisKegiatan: laporan.jenisKegiatan,
        domainNama: laporan.webApp.nama,
        status: "CONFIRMED",
        instruksi: null,
      }).catch((e) => console.error("[EMAIL] Gagal kirim notif konfirmasi:", e))
    }

    revalidatePath("/dashboard/laporan")
    revalidatePath("/dashboard")
    return { success: true, message: "Laporan berhasil dikonfirmasi" }
  } catch (error) {
    return handleError(error)
  }
}

export async function instruksiLaporan(id: string, instruksi: string): Promise<ActionResult> {
  try {
    const session = await requireAuth()
    if (session.user.role === "ADMIN") throw new Error("FORBIDDEN")
    if (!instruksi.trim()) return { success: false, message: "Instruksi tidak boleh kosong" }

    // ✅ Ambil data pembuat untuk kirim email
    const laporan = await prisma.activityReport.update({
      where: { id },
      data: { status: "INSTRUCTED", confirmedById: session.user.id, instruksi: instruksi.trim() },
      include: {
        webApp: { select: { nama: true } },
        createdBy: { select: { email: true, name: true, namaLengkap: true } },
      },
    })

    // ✅ Kirim email ke pembuat (fire and forget)
    if (laporan.createdBy?.email) {
      sendEmailStatusLaporan({
        pembuatEmail: laporan.createdBy.email,
        pembuatName: laporan.createdBy.namaLengkap ?? laporan.createdBy.name,
        jenisKegiatan: laporan.jenisKegiatan,
        domainNama: laporan.webApp.nama,
        status: "INSTRUCTED",
        instruksi: instruksi.trim(),
      }).catch((e) => console.error("[EMAIL] Gagal kirim notif instruksi:", e))
    }

    revalidatePath("/dashboard/laporan")
    return { success: true, message: "Instruksi berhasil diberikan" }
  } catch (error) {
    return handleError(error)
  }
}