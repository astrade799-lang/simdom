import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const histories = await prisma.domainHistory.findMany({
    where: { webAppId: params.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ histories })
}