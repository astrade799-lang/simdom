"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { domainSchema } from "@/lib/validations/domain"
import { revalidatePath } from "next/cache"
import type { WebStatus, Role } from "@prisma/client"

type ActionResult = { success: boolean; message: string }

async function requireAdminOrAbove() {
  const session = await auth()
  if (!session) throw new Error("UNAUTHORIZED")
  if (session.user.role === "KABID") throw new Error("FORBIDDEN")
  return session
}

async function requireSuperAdmin() {
  const session = await auth()
  if (!session) throw new Error("UNAUTHORIZED")
  if (session.user.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN")
  return session
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
    keterangan: get("keterangan"),
    adminTeknis: formData.get("adminTeknis") as string,
    kontakAdmin: formData.get("kontakAdmin") as string,
    vendor: get("vendor"),
    kontakVendor: get("kontakVendor"),
    platform: get("platform"),
    tanggalAktif: get("tanggalAktif"),
    tanggalExpired: get("tanggalExpired"),
  }
}

// ── Helper catat history ────────────────────────────────────
async function recordHistory(
  webAppId: string,
  userId: string,
  userName: string,
  action: string,
  changes: { field: string; oldValue: string | null; newValue: string | null }[]
) {
  if (changes.length === 0) return

  await prisma.domainHistory.createMany({
    data: changes.map((c) => ({
      webAppId,
      userId,
      userName,
      action,
      fieldName: c.field,
      oldValue: c.oldValue,
      newValue: c.newValue,
    })),
  })
}

// Label field yang mudah dibaca
const FIELD_LABELS: Record<string, string> = {
  nama: "Nama Aplikasi",
  url: "URL Domain",
  status: "Status",
  skpdId: "SKPD",
  adminTeknis: "Admin Teknis",
  kontakAdmin: "Kontak Admin",
  vendor: "Vendor",
  kontakVendor: "Kontak Vendor",
  platform: "Platform",
  keterangan: "Keterangan",
  alasanSuspend: "Alasan Suspend",
  tanggalAktif: "Tanggal Aktif",
  tanggalExpired: "Tanggal Expired",
}
// ───────────────────────────────────────────────────────────

export async function createDomain(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminOrAbove()
    const raw = parseFormData(formData)
    const validated = domainSchema.safeParse(raw)
    if (!validated.success) {
      return { success: false, message: validated.error.issues[0]?.message ?? "Validasi gagal" }
    }

    const { tanggalAktif, tanggalExpired, alasanSuspend, keterangan, status, ...rest } = validated.data

    await prisma.webApp.create({
      data: {
        ...rest,
        status,
        keterangan: keterangan ?? null,
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
    const session = await requireAdminOrAbove()
    const raw = parseFormData(formData)
    const validated = domainSchema.safeParse(raw)
    if (!validated.success) {
      return { success: false, message: validated.error.issues[0]?.message ?? "Validasi gagal" }
    }

    const { tanggalAktif, tanggalExpired, alasanSuspend, keterangan, status, ...rest } = validated.data

    // ── Ambil data lama untuk perbandingan ──
    const existing = await prisma.webApp.findUnique({ where: { id } })
    if (!existing) return { success: false, message: "Domain tidak ditemukan" }

    const newData = {
      ...rest,
      status,
      keterangan: keterangan ?? null,
      alasanSuspend: status !== "SUSPEND" ? null : alasanSuspend ?? null,
      tanggalAktif: tanggalAktif ? new Date(tanggalAktif) : null,
      tanggalExpired: tanggalExpired ? new Date(tanggalExpired) : null,
    }

    await prisma.webApp.update({ where: { id }, data: newData })

    // ── Catat field yang berubah ──
    const changes: { field: string; oldValue: string | null; newValue: string | null }[] = []

    const fieldsToCheck: (keyof typeof newData)[] = [
      "nama", "url", "status", "adminTeknis", "kontakAdmin",
      "vendor", "kontakVendor", "platform", "keterangan", "alasanSuspend",
    ]

    for (const field of fieldsToCheck) {
      const oldVal = String(existing[field] ?? "")
      const newVal = String(newData[field] ?? "")
      if (oldVal !== newVal) {
        changes.push({
          field: FIELD_LABELS[field] ?? field,
          oldValue: existing[field] ? String(existing[field]) : null,
          newValue: newData[field] ? String(newData[field]) : null,
        })
      }
    }

    await recordHistory(
      id,
      session!.user.id,
      session!.user.name ?? "Unknown",
      "UPDATE",
      changes
    )

    revalidatePath("/dashboard/domain")
    return { success: true, message: "Domain berhasil diperbarui" }
  } catch (error) {
    return handleError(error)
  }
}

export async function deleteDomain(id: string): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin()

    // Ambil nama domain sebelum dihapus
    const existing = await prisma.webApp.findUnique({
      where: { id },
      select: { nama: true, url: true },
    })

    // Catat history sebelum hapus
    if (existing) {
      await recordHistory(
        id,
        session!.user.id,
        session!.user.name ?? "Unknown",
        "DELETE",
        [{ field: "Domain", oldValue: `${existing.nama} (${existing.url})`, newValue: null }]
      )
    }

    await prisma.activityReport.deleteMany({ where: { webAppId: id } })
    await prisma.domainHistory.deleteMany({ where: { webAppId: id } })
    await prisma.webApp.delete({ where: { id } })

    revalidatePath("/dashboard/domain")
    return { success: true, message: "Domain berhasil dihapus" }
  } catch (error) {
    return handleError(error)
  }
}

export async function importDomains(formData: FormData): Promise<{
  imported: number
  skipped: number
  errors: string[]
}> {
  try {
    await requireAdminOrAbove()
    const raw = JSON.parse(formData.get("data") as string) as Array<{
      nama: string
      url: string
      skpdId: string
      status: string
      keterangan: string
    }>

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (const item of raw) {
      try {
        const existing = await prisma.webApp.findUnique({ where: { url: item.url } })
        if (existing) { skipped++; continue }

        await prisma.webApp.create({
          data: {
            nama: item.nama,
            url: item.url,
            skpdId: item.skpdId,
            status: item.status as WebStatus,
            keterangan: item.keterangan || null,
            adminTeknis: "-",
            kontakAdmin: "-",
          },
        })
        imported++
      } catch {
        errors.push(`Gagal import: ${item.url}`)
      }
    }

    revalidatePath("/dashboard/domain")
    revalidatePath("/dashboard")
    return { imported, skipped, errors }
  } catch {
    return { imported: 0, skipped: 0, errors: ["Terjadi kesalahan saat import"] }
  }
}