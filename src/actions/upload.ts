"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { auth } from "@/auth"

export async function uploadBuktiLaporan(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Unauthorized" }

  const file = formData.get("file") as File
  if (!file) return { error: "File tidak ditemukan" }

  // Validasi tipe file
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return { error: "Hanya file gambar yang diizinkan (JPG, PNG, WEBP, GIF)" }
  }

  // Validasi ukuran (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Ukuran file maksimal 5MB" }
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Nama file unik
  const ext = file.name.split(".").pop()
  const fileName = `${session.user.id}-${Date.now()}.${ext}`
  const filePath = `bukti/${fileName}`

  const { error } = await supabaseAdmin.storage
    .from("laporan-bukti")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error("[UPLOAD]", error)
    return { error: "Gagal upload file" }
  }

  // Ambil public URL
  const { data: urlData } = supabaseAdmin.storage
    .from("laporan-bukti")
    .getPublicUrl(filePath)

  return { url: urlData.publicUrl }
}

export async function deleteBuktiLaporan(filePath: string) {
  const session = await auth()
  if (!session?.user) return { error: "Unauthorized" }

  const { error } = await supabaseAdmin.storage
    .from("laporan-bukti")
    .remove([filePath])

  if (error) return { error: "Gagal hapus file" }
  return { success: true }
}