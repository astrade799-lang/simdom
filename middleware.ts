import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Session } from "next-auth"

const PUBLIC_ROUTES = ["/login"]
const SUPER_ADMIN_ONLY = ["/dashboard/users", "/dashboard/skpd"]

type AuthRequest = NextRequest & { auth: Session | null }

// ── Rate Limiting ─────────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000  // 15 menit
const MAX_ATTEMPTS = 10            // 10 percobaan per 15 menit

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (record) {
    if (now > record.resetAt) {
      loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
      return true
    }
    record.count++
    if (record.count > MAX_ATTEMPTS) return false
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  }
  return true
}
// ─────────────────────────────────────────────────────────────

export default auth((req: AuthRequest) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // ── Cek rate limit untuk endpoint login ──
  if (pathname === "/api/auth/callback/credentials") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown"

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
        { status: 429 }
      )
    }
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (session && SUPER_ADMIN_ONLY.some((r) => pathname.startsWith(r))) {
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons).*)"],
}