"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { domainSchema } from "@/lib/validations/domain"
import { revalidatePath } from "next/cache"

type ActionResult = { success: boolean; message: string }

async function requireAdminOrAbove() {
  const session = await auth()
  if (!session) throw new Error("UNAUTHORIZED")
  if (session.user.role === "KABID") throw new Error("FORBIDDEN")
}

async function requireSuperAdmin() {
  const session = await auth()
  if (!session) throw new Error("UNAUTHORIZED")
  if (session.user.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN")
}

function handleError(error: unknown): ActionResult {
  console.error("[Domain Action Error]:", error)
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return { success: false, message: "Silakan login terlebih dahulu" }
    if (error.message === "FORBIDDEN") return { success: false, message: "Anda tidak memiliki akses" }
    if ((error as any).code === "P2002") return { success: false, message: "URL domain sudah terdaftar" }
    if ((error as any).code === "P2025") return { success: false, message: "Data tidak ditemukan" }
    return { success: false, message: error.message }
  }
  return { success: false, message: String(error) }
}

function parseFormData(formData: FormData) {
  const get = (key: string) => (formData.get(key) as string) || null
  return {
    nama: formData.get("nama") as string,
    url: formData.get("url") as string,
    skpdId: formData.get("skpdId") as string,
    status: formData.get("status") as string,
    alasanSuspend: get("alasanSuspend"),
    adminTeknis: formData.get("adminTeknis") as string,
    kontakAdmin: formData.get("kontakAdmin") as string,
    vendor: get("vendor"),
    kontakVendor: get("kontakVendor"),
    platform: get("platform"),
    tanggalAktif: get("tanggalAktif"),
    tanggalExpired: get("tanggalExpired"),
  }
}

export async function createDomain(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminOrAbove()
    const raw = parseFormData(formData)
    const validated = domainSchema.safeParse(raw)
    if (!validated.success) return { success: false, message: validated.error.errors[0].message }

    const { tanggalAktif, tanggalExpired, alasanSuspend, status, ...rest } = validated.data

    await prisma.webApp.create({
      data: {
        ...rest,
        status,
        alasanSuspend: status !== "SUSPEND" ? null : alasanSuspend ?? null,
        tanggalAktif: tanggalAktif ? new Date(tanggalAktif) : null,
        tanggalExpired: tanggalExpired ? new Date(tanggalExpired) : null,
      },
    })
    revalidatePath("/dashboard/domain")
    return { success: true, message: "Domain berhasil ditambahkan" }
  } catch (error) {
    return handleError(error)
  }
}

export async function updateDomain(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminOrAbove()
    const raw = parseFormData(formData)
    const validated = domainSchema.safeParse(raw)
    if (!validated.success) return { success: false, message: validated.error.errors[0].message }

    const { tanggalAktif, tanggalExpired, alasanSuspend, status, ...rest } = validated.data

    await prisma.webApp.update({
      where: { id },
      data: {
        ...rest,
        status,
        alasanSuspend: status !== "SUSPEND" ? null : alasanSuspend ?? null,
        tanggalAktif: tanggalAktif ? new Date(tanggalAktif) : null,
        tanggalExpired: tanggalExpired ? new Date(tanggalExpired) : null,
      },
    })
    revalidatePath("/dashboard/domain")
    return { success: true, message: "Domain berhasil diperbarui" }
  } catch (error) {
    return handleError(error)
  }
}

export async function deleteDomain(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    await prisma.webApp.delete({ where: { id } })
    revalidatePath("/dashboard/domain")
    return { success: true, message: "Domain berhasil dihapus" }
  } catch (error) {
    return handleError(error)
  }
}