"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { laporanSchema } from "@/lib/validations/laporan"
import { revalidatePath } from "next/cache"

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

    await prisma.activityReport.create({
      data: {
        jenisKegiatan: validated.data.jenisKegiatan,
        deskripsi: validated.data.deskripsi,
        tanggal: new Date(validated.data.tanggal),
        webAppId: validated.data.webAppId,
        createdById: session.user.id,
        buktiUrl: (formData.get("buktiUrl") as string) || null,
      },
    })
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

    await prisma.activityReport.update({
      where: { id },
      data: { status: "CONFIRMED", confirmedById: session.user.id, instruksi: null },
    })
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

    await prisma.activityReport.update({
      where: { id },
      data: { status: "INSTRUCTED", confirmedById: session.user.id, instruksi: instruksi.trim() },
    })
    revalidatePath("/dashboard/laporan")
    return { success: true, message: "Instruksi berhasil diberikan" }
  } catch (error) {
    return handleError(error)
  }
}