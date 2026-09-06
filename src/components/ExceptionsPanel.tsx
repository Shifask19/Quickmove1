import type { Case } from '../types'

interface Props { c: Case }

const EXCEPTION_ICONS: Record<string, string> = {
  missing_documents:  '📄',
  overdue_request:    '⏰',
  install_after_movein: '🚨',
  date_changed:       '📅',
  duplicate_request:  '🔁',
}

export function ExceptionsPanel({ c }: Props) {
  const active = c.exceptions.filter(e => !e.resolved)
  const resolved = c.exceptions.filter(e => e.resolved)

  if (c.exceptions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-sm text-emerald-600 font-medium">No exceptions detected</p>
        <p className="text-xs text-slate-400 mt-1">The system continuously checks for issues</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {active.map(ex => (
        <div key={ex.id} className={`rounded-xl border p-4 ${
          ex.severity === 'critical'
            ? 'bg-red-50 border-red-300'
            : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">{EXCEPTION_ICONS[ex.type] ?? '⚠'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  ex.severity === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {ex.severity}
                </span>
                <span className="text-xs text-slate-400">{ex.type.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-sm text-slate-700">{ex.message}</p>
              <p className="text-xs text-slate-400 mt-1">Detected: {new Date(ex.detectedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ))}
      {resolved.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Resolved</p>
          {resolved.map(ex => (
            <div key={ex.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 opacity-60 mb-2">
              <p className="text-sm text-slate-500 line-through">{ex.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
