"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { getNavByRole } from "@/lib/navigation"
import type { Role } from "@prisma/client"

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  KABID: "Kabid / Kasubag",
}

interface SidebarProps {
  userName: string
  userRole: Role
}

const ICONS: Record<string, React.ReactNode> = {
  grid: (
    <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  building: (
    <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  globe: (
    <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  "file-text": (
    <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  users: (
    <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  chart: (
  <svg className="h-[17px] w-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
  </svg>
),
}

// Globe + Shield icon (sama dengan favicon)
function BrandIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#1d4ed8"/>
      <circle cx="16" cy="14" r="7.5" fill="none" stroke="white" strokeWidth="1.3"/>
      <line x1="8.5" y1="14" x2="23.5" y2="14" stroke="white" strokeWidth="1.1"/>
      <ellipse cx="16" cy="14" rx="3.2" ry="7.5" fill="none" stroke="white" strokeWidth="1.1"/>
      <path d="M10 9.5 Q16 7.5 22 9.5" fill="none" stroke="white" strokeWidth="1"/>
      <path d="M10 18.5 Q16 20.5 22 18.5" fill="none" stroke="white" strokeWidth="1"/>
      <path d="M20 18 L20 24.5 Q20 26.5 23.5 27.5 Q27 26.5 27 24.5 L27 18 Z" fill="#1e40af" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
      <polyline points="21.5,22.5 23,24 25.5,21" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const navItems = getNavByRole(userRole)

  return (
    <aside className="flex h-screen w-60 flex-col bg-slate-900">

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-[60px] border-b border-slate-700/50 flex-shrink-0">
        <BrandIcon />
        <div>
          <p className="text-sm font-bold text-white leading-none tracking-wide">SIMDOM</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Diskominfo Soppeng</p>
        </div>
      </div>

      {/* Nav label */}
      <div className="px-4 pt-5 pb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Menu Utama
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all relative ${
                isActive
                  ? "bg-blue-600 text-white font-medium shadow-lg shadow-blue-900/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white font-normal"
              }`}
            >
              <span className={isActive ? "text-white" : "text-slate-500"}>
                {ICONS[item.icon]}
              </span>
              {item.label}
              {/* Active dot indicator */}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-300" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-slate-700/50" />

      {/* User */}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/50">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white ring-2 ring-blue-500/30">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-200">{userName}</p>
            <p className="text-[10px] text-slate-500">{ROLE_LABEL[userRole]}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Keluar
        </button>
      </div>

    </aside>
  )
}