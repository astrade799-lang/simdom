import type { WebStatus, ActivityStatus } from "@prisma/client"

const WEB_CONFIG: Record<WebStatus, { label: string; className: string }> = {
  AKTIF: { label: "Aktif", className: "bg-green-100 text-green-700" },
  TIDAK_AKTIF: { label: "Tidak Aktif", className: "bg-gray-100 text-gray-600" },
  SUSPEND: { label: "Suspend", className: "bg-red-100 text-red-700" },
}

const ACTIVITY_CONFIG: Record<ActivityStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Dikonfirmasi", className: "bg-green-100 text-green-700" },
  INSTRUCTED: { label: "Diberi Instruksi", className: "bg-blue-100 text-blue-700" },
}

export function StatusBadge({ status }: { status: WebStatus }) {
  const { label, className } = WEB_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export function ActivityBadge({ status }: { status: ActivityStatus }) {
  const { label, className } = ACTIVITY_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}