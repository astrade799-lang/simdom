import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params  // ← await params dulu

  const histories = await prisma.domainHistory.findMany({
    where: { webAppId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ histories })
}