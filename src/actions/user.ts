"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createUserSchema, updateUserSchema, resetPasswordSchema } from "@/lib/validations/user"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

type ActionResult = { success: boolean; message: string }

async function requireSuperAdmin() {
  const session = await auth()
  if (!session) throw new Error("UNAUTHORIZED")
  if (session.user.role !== "SUPER_ADMIN") throw new Error("FORBIDDEN")
  return session
}

function handleError(error: unknown): ActionResult {
  console.error("[User Action Error]:", error)
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return { success: false, message: "Silakan login terlebih dahulu" }
    if (error.message === "FORBIDDEN") return { success: false, message: "Anda tidak memiliki akses" }
    if ((error as any).code === "P2002") return { success: false, message: "Email sudah terdaftar" }
    return { success: false, message: error.message }
  }
  return { success: false, message: String(error) }
}

export async function createUser(formData: FormData): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: formData.get("role") as string,
      skpdId: (formData.get("skpdId") as string) || null,
    }
    const validated = createUserSchema.safeParse(raw)
    if (!validated.success) {
      return { success: false, message: validated.error.issues[0]?.message ?? "Validasi gagal" }
    }
    const hashedPassword = await bcrypt.hash(validated.data.password, 12)
    await prisma.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        password: hashedPassword,
        role: validated.data.role,
        skpdId: validated.data.skpdId || null,
        namaLengkap: (formData.get("namaLengkap") as string) || null,
        nip: (formData.get("nip") as string) || null,
      },
    })
    revalidatePath("/dashboard/users")
    return { success: true, message: "User berhasil ditambahkan" }
  } catch (error) {
    return handleError(error)
  }
}

export async function updateUser(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      skpdId: (formData.get("skpdId") as string) || null,
    }
    const validated = updateUserSchema.safeParse(raw)
    if (!validated.success) {
      return { success: false, message: validated.error.issues[0]?.message ?? "Validasi gagal" }
    }
    await prisma.user.update({
      where: { id },
      data: {
        name: validated.data.name,
        email: validated.data.email,
        role: validated.data.role,
        skpdId: validated.data.skpdId || null,
        namaLengkap: (formData.get("namaLengkap") as string) || null,
        nip: (formData.get("nip") as string) || null,
      },
    })
    revalidatePath("/dashboard/users")
    return { success: true, message: "User berhasil diperbarui" }
  } catch (error) {
    return handleError(error)
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin()
    if (session.user.id === id) {
      return { success: false, message: "Tidak bisa menghapus akun sendiri" }
    }
    await prisma.user.delete({ where: { id } })
    revalidatePath("/dashboard/users")
    return { success: true, message: "User berhasil dihapus" }
  } catch (error) {
    return handleError(error)
  }
}

export async function resetPassword(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireSuperAdmin()
    const raw = { password: formData.get("password") as string }
    const validated = resetPasswordSchema.safeParse(raw)
    if (!validated.success) {
      return { success: false, message: validated.error.issues[0]?.message ?? "Validasi gagal" }
    }
    const hashedPassword = await bcrypt.hash(validated.data.password, 12)
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } })
    return { success: true, message: "Password berhasil direset" }
  } catch (error) {
    return handleError(error)
  }
}