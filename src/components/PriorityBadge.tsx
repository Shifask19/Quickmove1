import type { CasePriority } from '../types'

interface Props {
  priority: CasePriority
  large?: boolean
}

const CONFIG = {
  critical: { label: 'Critical',  dot: 'bg-red-500',     classes: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
  warning:  { label: 'Warning',   dot: 'bg-amber-400',   classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  on_track: { label: 'On Track',  dot: 'bg-emerald-500', classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
}

export function PriorityBadge({ priority, large = false }: Props) {
  const { label, dot, classes } = CONFIG[priority]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
      large ? 'text-xs px-2.5 py-1' : 'text-xs px-2 py-0.5'
    } ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  )
}
