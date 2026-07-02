"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { AuditGrade } from "@prisma/client"

type ActionResult = { success: boolean; message: string }

async function requireAuth() {
  const session = await auth()
  if (!session) throw new Error("UNAUTHORIZED")
  if (session.user.role === "KABID") throw new Error("FORBIDDEN")
  return session
}

function handleError(error: unknown): ActionResult {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return { success: false, message: "Silakan login terlebih dahulu" }
    if (error.message === "FORBIDDEN") return { success: false, message: "Hanya Admin yang bisa melakukan audit" }
    return { success: false, message: error.message }
  }
  return { success: false, message: String(error) }
}

export async function createAudit(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAuth()

    await prisma.technicalAudit.create({
      data: {
        webAppId: formData.get("webAppId") as string,
        checkedById: session.user.id,
        checkedByName: session.user.name ?? "Unknown",
        performanceGrade: (formData.get("performanceGrade") as AuditGrade) || "BELUM_CEK",
        performanceScore: formData.get("performanceScore") ? parseInt(formData.get("performanceScore") as string) : null,
        performanceLink: (formData.get("performanceLink") as string) || null,
        securityGrade: (formData.get("securityGrade") as AuditGrade) || "BELUM_CEK",
        securityScore: (formData.get("securityScore") as string) || null,
        securityLink: (formData.get("securityLink") as string) || null,
        dnsGrade: (formData.get("dnsGrade") as AuditGrade) || "BELUM_CEK",
        dnsStatus: (formData.get("dnsStatus") as string) || null,
        dnsLink: (formData.get("dnsLink") as string) || null,
        teknologi: (formData.get("teknologi") as string) || null,
        catatanUmum: (formData.get("catatanUmum") as string) || null,
      },
    })

    revalidatePath("/dashboard/domain")
    return { success: true, message: "Audit berhasil disimpan" }
  } catch (error) {
    return handleError(error)
  }
}

export async function getLatestAudit(webAppId: string) {
  return prisma.technicalAudit.findFirst({
    where: { webAppId },
    orderBy: { checkedAt: "desc" },
  })
}