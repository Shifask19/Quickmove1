import type { ConnectionRequest, ConnectionStatus } from '../types'
import { daysBetween, todayStr } from '../engine/logic'

interface Props {
  connections: ConnectionRequest[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
}

const BORDER: Record<ConnectionStatus, string> = {
  collecting_docs: 'border-l-amber-400',
  ready_to_submit: 'border-l-indigo-500',
  submitted:       'border-l-blue-500',
  scheduled:       'border-l-teal-500',
  completed:       'border-l-emerald-500',
}

function urgencyLabel(conn: ConnectionRequest): { text: string; cls: string } {
  const dl = daysBetween(todayStr(), conn.slaDeadline ?? conn.moveInDate)
  if (conn.status === 'completed')  return { text: 'Done',       cls: 'text-emerald-600' }
  if (conn.status === 'submitted')  return { text: 'Submitted',  cls: 'text-blue-600' }
  if (dl < 0)                       return { text: 'Overdue',    cls: 'text-red-600 font-bold' }
  if (dl <= 3)                      return { text: `${dl}d left`, cls: 'text-red-500 font-semibold' }
  if (dl <= 7)                      return { text: `${dl}d left`, cls: 'text-amber-600' }
  return { text: `${dl}d left`, cls: 'text-gray-400' }
}

export function Sidebar({ connections, activeId, onSelect, onNew }: Props) {
  const critical  = connections.filter(c => c.priority === 'critical').length
  const warning   = connections.filter(c => c.priority === 'warning').length
  const onTrack   = connections.filter(c => c.priority === 'on_track').length

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm">

      {/* Brand */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">Q</div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">QuickMove Ops</p>
              <p className="text-xs text-gray-400 mt-0.5">Utility Setup · India</p>
            </div>
          </div>
          <button
            onClick={onNew}
            className="w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center text-xl leading-none transition-colors flex-shrink-0"
            title="New Case"
          >+</button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-1.5">
          <StatBubble count={critical} label="Critical" color="red" />
          <StatBubble count={warning}  label="Warning"  color="amber" />
          <StatBubble count={onTrack}  label="On Track" color="emerald" />
        </div>
      </div>

      {/* Cases label */}
      <div className="px-5 pt-3 pb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cases</p>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{connections.length}</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {connections.map(conn => {
          const u     = urgencyLabel(conn)
          const ver   = conn.documents.filter(d => d.status === 'verified').length
          const total = conn.documents.length
          const pct   = total > 0 ? Math.round((ver / total) * 100) : 0
          const act   = conn.id === activeId

          return (
            <button key={conn.id} onClick={() => onSelect(conn.id)}
              className={`w-full text-left px-3 py-3 rounded-xl border-l-4 transition-all ${BORDER[conn.status]} ${
                act ? 'bg-indigo-50 shadow-sm' : 'hover:bg-gray-50'
              }`}>
              <div className="flex items-start justify-between gap-1 mb-0.5">
                <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{conn.customerName}</p>
                <span className={`text-xs flex-shrink-0 ${u.cls}`}>{u.text}</span>
              </div>
              <p className="text-xs text-gray-400 truncate mb-2">
                {conn.city} · {conn.utilities.map(u => u.type).join(', ')}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    pct === 100 ? 'bg-emerald-500' : 'bg-indigo-400'
                  }`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{ver}/{total}</span>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function StatBubble({ count, label, color }: { count: number; label: string; color: 'red' | 'amber' | 'emerald' }) {
  const cls = {
    red:     'bg-red-50 text-red-600',
    amber:   'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }[color]
  return (
    <div className={`${cls} rounded-xl py-2 text-center`}>
      <p className="text-lg font-black leading-none">{count}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
    </div>
  )
}
