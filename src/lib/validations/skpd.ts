import { z } from "zod"

export const skpdSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  singkatan: z.string().min(2, "Singkatan minimal 2 karakter").toUpperCase(),
  penanggungjawab: z.string().min(3, "Nama penanggung jawab minimal 3 karakter"),
  kontak: z.string().min(5, "Kontak minimal 5 karakter"),
})

export type SkpdInput = z.infer<typeof skpdSchema>