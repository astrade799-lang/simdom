import { z } from "zod"

export const laporanSchema = z.object({
  jenisKegiatan: z.string().min(3, "Jenis kegiatan minimal 3 karakter"),
  deskripsi: z.string().min(10, "Deskripsi minimal 10 karakter"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  webAppId: z.string().min(1, "Domain wajib dipilih"),
})

export type LaporanInput = z.infer<typeof laporanSchema>