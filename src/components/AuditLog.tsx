import type { Case } from '../types'

interface Props { c: Case }

export function AuditLog({ c }: Props) {
  const sorted = [...c.auditLog].reverse()

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">No activity yet.</p>
  }

  return (
    <div className="space-y-0">
      {sorted.map((entry, i) => {
        const date = new Date(entry.timestamp)
        const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })

        return (
          <div key={entry.id} className="flex gap-3 pb-4">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
              {i < sorted.length - 1 && (
                <div className="w-px flex-1 bg-slate-200 mt-1" />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 pb-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-slate-700">{entry.action}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">{timeStr} · {dateStr}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{entry.details}</p>
              <p className="text-xs text-indigo-500 mt-0.5">by {entry.actor}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
