import { z } from "zod"

// Password policy yang lebih kuat
const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung huruf kapital")
  .regex(/[0-9]/, "Password harus mengandung angka")

export const createUserSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: passwordSchema,
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
  password: passwordSchema,
})