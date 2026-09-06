import { useState } from 'react'
import type { Case, UtilityRequest } from '../types'
import type { Action } from '../store/store'
import { formatDate, daysBetween, today } from '../engine/caseEngine'

interface Props {
  c: Case
  dispatch: React.Dispatch<Action>
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   classes: 'bg-slate-100 text-slate-600 border border-slate-300' },
  scheduled: { label: 'Scheduled', classes: 'bg-blue-100 text-blue-700 border border-blue-300' },
  completed: { label: 'Completed', classes: 'bg-emerald-100 text-emerald-700 border border-emerald-300' },
  overdue:   { label: 'Overdue',   classes: 'bg-red-100 text-red-700 border border-red-300' },
  cancelled: { label: 'Cancelled', classes: 'bg-slate-100 text-slate-400 border border-slate-200' },
}

const UTILITY_ICONS: Record<string, string> = {
  electricity: '⚡', gas: '🔥', water: '💧', internet: '📶', waste: '🗑️',
}

export function UtilityTracker({ c, dispatch }: Props) {
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')

  function handleSchedule(req: UtilityRequest) {
    if (!scheduleDate) return
    dispatch({ type: 'SET_SCHEDULED_DATE', caseId: c.id, reqId: req.id, date: scheduleDate })
    setSchedulingId(null)
    setScheduleDate('')
  }

  function handleMarkInstalled(reqId: string) {
    dispatch({ type: 'MARK_INSTALLED', caseId: c.id, reqId })
  }

  return (
    <div className="space-y-3">
      {c.utilityRequests.map(req => {
        const daysToSLA = daysBetween(today(), req.slaDeadline)
        const slaOverdue = req.slaDeadline < today() && req.status !== 'completed'
        const installAfterMovein = req.scheduledDate && req.scheduledDate > c.moveInDate
        const statusConfig = STATUS_CONFIG[req.status]

        return (
          <div key={req.id} className={`border rounded-xl p-4 ${
            req.status === 'overdue' || installAfterMovein
              ? 'border-red-300 bg-red-50'
              : req.status === 'completed'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{UTILITY_ICONS[req.type]}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 capitalize">{req.type}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.classes}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{req.provider}</p>
                </div>
              </div>
              {/* Actions */}
              {req.status !== 'completed' && req.status !== 'cancelled' && (
                <div className="flex gap-2 flex-shrink-0">
                  {schedulingId !== req.id && (
                    <button
                      onClick={() => setSchedulingId(req.id)}
                      className="text-xs font-medium px-2.5 py-1 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50"
                    >
                      {req.scheduledDate ? 'Reschedule' : 'Schedule'}
                    </button>
                  )}
                  {req.scheduledDate && req.status === 'scheduled' && (
                    <button
                      onClick={() => handleMarkInstalled(req.id)}
                      className="text-xs font-medium px-2.5 py-1 border border-emerald-400 text-emerald-700 rounded-lg hover:bg-emerald-50"
                    >
                      Mark Installed ✓
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SLA / dates */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className={`text-xs rounded-lg px-3 py-2 ${slaOverdue ? 'bg-red-100' : 'bg-slate-50'}`}>
                <div className={`font-semibold ${slaOverdue ? 'text-red-700' : 'text-slate-700'}`}>
                  SLA Deadline
                </div>
                <div className={`${slaOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                  {formatDate(req.slaDeadline)}
                  {slaOverdue
                    ? ` (${Math.abs(daysToSLA)}d overdue)`
                    : daysToSLA >= 0
                      ? ` (${daysToSLA}d left)`
                      : ''}
                </div>
              </div>
              <div className={`text-xs rounded-lg px-3 py-2 ${installAfterMovein ? 'bg-red-100' : 'bg-slate-50'}`}>
                <div className={`font-semibold ${installAfterMovein ? 'text-red-700' : 'text-slate-700'}`}>
                  Installation Date
                </div>
                <div className={`${installAfterMovein ? 'text-red-600' : 'text-slate-500'}`}>
                  {req.installedDate
                    ? `✓ ${formatDate(req.installedDate)}`
                    : req.scheduledDate
                      ? `📅 ${formatDate(req.scheduledDate)}${installAfterMovein ? ' ⚠ After move-in!' : ''}`
                      : 'Not scheduled'}
                </div>
              </div>
            </div>

            {/* Schedule input */}
            {schedulingId === req.id && (
              <div className="mt-3 flex gap-2 items-center">
                <input
                  type="date"
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm flex-1"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                />
                <button
                  onClick={() => handleSchedule(req)}
                  className="text-sm font-medium px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => { setSchedulingId(null); setScheduleDate('') }}
                  className="text-sm font-medium px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
