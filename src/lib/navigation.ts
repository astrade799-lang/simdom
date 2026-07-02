import type { Role } from "@prisma/client"

interface NavItem {
  label: string
  href: string
  icon: string
  roles: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "grid",
    roles: ["SUPER_ADMIN", "ADMIN", "KABID"],
  },
  {
    label: "Data SKPD",
    href: "/dashboard/skpd",
    icon: "building",
    roles: ["SUPER_ADMIN"],
  },
  {
    label: "Domain & Subdomain",
    href: "/dashboard/domain",
    icon: "globe",
    roles: ["SUPER_ADMIN", "ADMIN", "KABID"],
  },
  {
    label: "Laporan Aktivitas",
    href: "/dashboard/laporan",
    icon: "file-text",
    roles: ["SUPER_ADMIN", "ADMIN", "KABID"],
  },
  {
    label: "Manajemen User",
    href: "/dashboard/users",
    icon: "users",
    roles: ["SUPER_ADMIN"],
  },
  {
  label: "Dashboard Eksekutif",
  href: "/dashboard/executive",
  icon: "chart",
  roles: ["SUPER_ADMIN", "ADMIN", "KABID"],
},
]

export function getNavByRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}