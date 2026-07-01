import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Vercel Cron akan hit endpoint ini
export async function GET(request: NextRequest) {
  // Validasi request dari Vercel Cron (bukan dari luar)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Ambil semua domain yang aktif
  const domains = await prisma.webApp.findMany({
    where: { status: "AKTIF" },
    select: { id: true, url: true, nama: true },
  })

  const results = { checked: 0, online: 0, offline: 0, errors: 0 }

  // Cek setiap domain
  for (const domain of domains) {
    try {
      const start = Date.now()
      const response = await fetch(`https://${domain.url}`, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000), // timeout 10 detik
        headers: { "User-Agent": "SIMDOM-Monitor/1.0" },
      })
      const responseTime = Date.now() - start
      const isOnline = response.status < 500

      await prisma.domainCheck.create({
        data: {
          webAppId: domain.id,
          isOnline,
          responseTime,
          statusCode: response.status,
        },
      })

      if (isOnline) results.online++
      else results.offline++
    } catch {
      // Domain tidak bisa diakses sama sekali
      await prisma.domainCheck.create({
        data: {
          webAppId: domain.id,
          isOnline: false,
          responseTime: null,
          statusCode: null,
        },
      })
      results.offline++
      results.errors++
    }
    results.checked++
  }

  // Hapus data check lebih dari 30 hari (cleanup otomatis)
  await prisma.domainCheck.deleteMany({
    where: {
      checkedAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  })

  console.log(`[CRON] Domain check selesai:`, results)
  return NextResponse.json({ success: true, ...results })
}