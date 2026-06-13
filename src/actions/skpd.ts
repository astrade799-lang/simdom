"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { skpdSchema } from "@/lib/validations/skpd"
import { revalidatePath } from "next/cache"

type ActionResult = { success: boolean; message: string }

async function requireSuperAdmin() {
  const session = await auth()
  if (!session) throw new Error("UNAUTHORIZED")
  if (session.user.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN")
}

function handleError(error: unknown): ActionResult {
  console.error("[SKPD Action Error]:", error)
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return { success: false, message: "Silakan login terlebih dahulu" }
    if (error.message === "FORBIDDEN") return { success: false, message: "Anda tidak memiliki akses" }
    if ((error as any).code === "P2002") return { success: false, message: "Singkatan SKPD sudah digunakan" }
    if ((error as any).code === "P2025") return { success: false, message: "Data tidak ditemukan" }
    return { success: false, message: error.message }
  }
  return { success: false, message: String(error) }
}

export async function createSkpd(formData: FormData): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    const raw = {
      nama: formData.get("nama") as string,
      singkatan: formData.get("singkatan") as string,
      penanggungjawab: formData.get("penanggungjawab") as string,
      kontak: formData.get("kontak") as string,
    }
    const validated = skpdSchema.safeParse(raw)
    if (!validated.success) {
      return { success: false, message: validated.error.issues[0]?.message ?? "Validasi gagal" }
    }
    await prisma.skpd.create({ data: validated.data })
    revalidatePath("/dashboard/skpd")
    return { success: true, message: "SKPD berhasil ditambahkan" }
  } catch (error) {
    return handleError(error)
  }
}

export async function updateSkpd(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    const raw = {
      nama: formData.get("nama") as string,
      singkatan: formData.get("singkatan") as string,
      penanggungjawab: formData.get("penanggungjawab") as string,
      kontak: formData.get("kontak") as string,
    }
    const validated = skpdSchema.safeParse(raw)
    if (!validated.success) {
      return { success: false, message: validated.error.issues[0]?.message ?? "Validasi gagal" }
    }
    await prisma.skpd.update({ where: { id }, data: validated.data })
    revalidatePath("/dashboard/skpd")
    return { success: true, message: "SKPD berhasil diperbarui" }
  } catch (error) {
    return handleError(error)
  }
}

export async function deleteSkpd(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    const webAppCount = await prisma.webApp.count({ where: { skpdId: id } })
    if (webAppCount > 0) {
      return { success: false, message: `SKPD tidak bisa dihapus karena masih memiliki ${webAppCount} domain` }
    }
    await prisma.skpd.delete({ where: { id } })
    revalidatePath("/dashboard/skpd")
    return { success: true, message: "SKPD berhasil dihapus" }
  } catch (error) {
    return handleError(error)
  }
}