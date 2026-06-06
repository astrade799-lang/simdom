import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Session } from "next-auth"

const PUBLIC_ROUTES = ["/login"]
const SUPER_ADMIN_ONLY = ["/dashboard/users", "/dashboard/skpd"]

type AuthRequest = NextRequest & { auth: Session | null }

export default auth((req: AuthRequest) => {
  const { pathname } = req.nextUrl
  const session = req.auth

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