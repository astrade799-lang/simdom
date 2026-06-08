import type { WebStatus } from "@prisma/client"

const CONFIG: Record<WebStatus, { label: string; className: string }> = {
  AKTIF: { label: "Aktif", className: "bg-green-100 text-green-700" },
  TIDAK_AKTIF: { label: "Tidak Aktif", className: "bg-gray-100 text-gray-600" },
  SUSPEND: { label: "Suspend", className: "bg-red-100 text-red-700" },
}

export function StatusBadge({ status }: { status: WebStatus }) {
  const { label, className } = CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}