import { z } from "zod"

export const createUserSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "KABID"]),
  skpdId: z.string().optional().nullable(),
})

export const updateUserSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "KABID"]),
  skpdId: z.string().optional().nullable(),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter"),
})