import { z } from "zod"

export const domainSchema = z.object({
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  url: z.string().min(3, "URL tidak valid"),
  skpdId: z.string().min(1, "SKPD wajib dipilih"),
  status: z.enum(["AKTIF", "TIDAK_AKTIF", "SUSPEND"]),
  alasanSuspend: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
  adminTeknis: z.string().min(2, "Nama admin teknis minimal 2 karakter"),
  kontakAdmin: z.string().min(5, "Kontak admin minimal 5 karakter"),
  vendor: z.string().optional().nullable(),
  kontakVendor: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  tanggalAktif: z.string().optional().nullable(),
  tanggalExpired: z.string().optional().nullable(),
}).refine(
  (data) => data.status !== "SUSPEND" || (data.alasanSuspend && data.alasanSuspend.length > 0),
  { message: "Alasan suspend wajib diisi", path: ["alasanSuspend"] }
)

export type DomainInput = z.infer<typeof domainSchema>