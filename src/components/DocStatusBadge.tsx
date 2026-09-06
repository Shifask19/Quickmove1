import type { DocumentStatus } from '../types'

interface Props { status: DocumentStatus }

const CONFIG: Record<DocumentStatus, { label: string; classes: string }> = {
  missing:  { label: 'Missing',  classes: 'bg-gray-100 text-gray-500' },
  uploaded: { label: 'Uploaded', classes: 'bg-blue-50 text-blue-600' },
  verified: { label: 'Verified', classes: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-600' },
}

export function DocStatusBadge({ status }: Props) {
  const { label, classes } = CONFIG[status]
  return (
    <span className={`inline-flex items-center text-xs font-medium rounded-md px-1.5 py-0.5 ${classes}`}>
      {label}
    </span>
  )
}
