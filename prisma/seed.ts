import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  const diskominfo = await prisma.skpd.upsert({
    where: { singkatan: "DISKOMINFO" },
    update: {},
    create: {
      nama: "Dinas Komunikasi dan Informatika",
      singkatan: "DISKOMINFO",
      penanggungjawab: "Kepala Dinas",
      kontak: "0812-0000-0001",
    },
  })

  const hashedPassword = await bcrypt.hash("Admin1234", 12)

  await prisma.user.upsert({
    where: { email: "superadmin@soppeng.go.id" },
    update: {},
    create: {
      email: "superadmin@soppeng.go.id",
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      skpdId: diskominfo.id,
    },
  })

  await prisma.user.upsert({
    where: { email: "admin@soppeng.go.id" },
    update: {},
    create: {
      email: "admin@soppeng.go.id",
      name: "Admin Diskominfo",
      password: hashedPassword,
      role: "ADMIN",
      skpdId: diskominfo.id,
    },
  })

  await prisma.user.upsert({
    where: { email: "kabid@soppeng.go.id" },
    update: {},
    create: {
      email: "kabid@soppeng.go.id",
      name: "Kabid Infrastruktur",
      password: hashedPassword,
      role: "KABID",
      skpdId: diskominfo.id,
    },
  })

  console.log("✅ Seed selesai!")
  console.log("─────────────────────────────────────")
  console.log("Super Admin : superadmin@soppeng.go.id")
  console.log("Admin       : admin@soppeng.go.id")
  console.log("Kabid       : kabid@soppeng.go.id")
  console.log("Password    : Admin1234")
  console.log("─────────────────────────────────────")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())