import { useState } from 'react'
import type { Case, UtilityRequest, UtilityType } from '../types'
import type { AppState, Action } from '../store/store'
import { PriorityBadge } from './PriorityBadge'
import { DocumentChecklist } from './DocumentChecklist'
import { formatDate, daysBetween, today } from '../engine/caseEngine'

interface Props { state: AppState; dispatch: React.Dispatch<Action> }

const UTILITY_ICONS: Record<UtilityType, string> = {
  electricity: '⚡', gas: '🔥', water: '💧', internet: '📶', waste: '🗑️',
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function CaseDetail({ state, dispatch }: Props) {
  const c = state.cases.find(x => x.id === state.selectedCaseId)

  if (!c) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center text-3xl">📋</div>
        <p className="text-gray-600 font-semibold text-sm">Select a case to get started</p>
        <p className="text-gray-400 text-xs">Cases are sorted by urgency on the left</p>
      </div>
    )
  }

  const daysToMove = daysBetween(today(), c.moveInDate)
  const activeExceptions = c.exceptions.filter(e => !e.resolved)
  const criticals = activeExceptions.filter(e => e.severity === 'critical')
  const warnings  = activeExceptions.filter(e => e.severity === 'warning')
  const docsVerified   = c.documents.filter(d => d.status === 'verified').length
  const docsTotal      = c.documents.length
  const utilitiesDone  = c.utilityRequests.filter(r => r.status === 'completed').length
  const utilitiesTotal = c.utilityRequests.length

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-6 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900">{c.customerName}</h1>
            <PriorityBadge priority={c.priority} large />
            <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-md">
              #{c.id}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <span>📍 {c.toAddress}</span>
            <span className="text-gray-300">·</span>
            <span>Move-in {formatDate(c.moveInDate)}</span>
            <span className="text-gray-300">·</span>
            <span className={
              daysToMove < 0  ? 'text-gray-400' :
              daysToMove <= 3 ? 'text-red-600 font-semibold' :
              daysToMove <= 7 ? 'text-amber-600 font-semibold' : 'text-gray-500'
            }>
              {daysToMove < 0  ? `${Math.abs(daysToMove)} days past move-in` :
               daysToMove === 0 ? '🚨 Move-in today!' :
               `${daysToMove} days to move-in`}
            </span>
          </div>
        </div>

        {/* Progress pills */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <ProgressPill label="Docs"      current={docsVerified}  total={docsTotal}      color="indigo" />
          <ProgressPill label="Utilities" current={utilitiesDone} total={utilitiesTotal} color="emerald" />
          {activeExceptions.length > 0 && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              criticals.length > 0
                ? 'bg-red-50 text-red-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              ⚠ {activeExceptions.length} issue{activeExceptions.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Next action banner ───────────────────────────────────────────── */}
      {c.aiInsight.nextAction && (
        <div className="mx-6 mt-5 flex-shrink-0">
          <div className="bg-indigo-600 rounded-2xl px-5 py-3.5 flex items-start gap-3">
            <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold">
              →
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-0.5">
                Next action for you
              </p>
              <p className="text-sm text-white font-medium leading-relaxed">
                {c.aiInsight.nextAction}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Inline alert banners ─────────────────────────────────────────── */}
      {criticals.length > 0 && (
        <div className="mx-6 mt-3 space-y-2 flex-shrink-0">
          {criticals.slice(0, 2).map(ex => (
            <div key={ex.id}
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-red-400 text-sm flex-shrink-0 mt-0.5">⚠</span>
              <p className="text-sm text-red-700 leading-relaxed">{ex.message}</p>
            </div>
          ))}
        </div>
      )}
      {warnings.length > 0 && criticals.length === 0 && (
        <div className="mx-6 mt-3 flex-shrink-0">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-amber-400 text-sm flex-shrink-0 mt-0.5">○</span>
            <p className="text-sm text-amber-700 leading-relaxed">{warnings[0].message}</p>
          </div>
        </div>
      )}

      {/* ── Two-column workspace ─────────────────────────────────────────── */}
      <div className="flex-1 flex gap-5 px-6 py-5 min-h-0 overflow-hidden">

        {/* Left: Documents + Utilities + Log */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto pr-1">
          <DocumentChecklist c={c} dispatch={dispatch} />
          <UtilSection c={c} dispatch={dispatch} />
          <LogSection c={c} />
        </div>

        {/* Right: AI + Exceptions + Customer */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          <AISection c={c} />
          <ExSection c={c} />
          <CustomerCard c={c} />
        </div>
      </div>
    </div>
  )
}

// ── Progress pill ─────────────────────────────────────────────────────────────

function ProgressPill({
  label, current, total, color,
}: { label: string; current: number; total: number; color: 'indigo' | 'emerald' }) {
  const pct      = total > 0 ? Math.round((current / total) * 100) : 0
  const barColor = color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500'
  const txtColor = color === 'indigo' ? 'text-indigo-600' : 'text-emerald-600'
  return (
    <div className="w-24">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className={`font-bold ${txtColor}`}>{current}/{total}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Utility requests ──────────────────────────────────────────────────────────

function UtilSection({ c, dispatch }: { c: Case; dispatch: React.Dispatch<Action> }) {
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate]  = useState('')

  const STATUS: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Pending',   cls: 'bg-gray-100 text-gray-600' },
    scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700' },
    completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700' },
    overdue:   { label: 'Overdue',   cls: 'bg-red-50 text-red-700' },
    cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-400' },
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">Utility Requests &amp; SLA Deadlines</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {c.utilityRequests.map(req => {
          const slaOverdue  = req.slaDeadline < today() && req.status !== 'completed'
          const afterMovein = req.scheduledDate && req.scheduledDate > c.moveInDate
          const daysToSLA   = daysBetween(today(), req.slaDeadline)
          const sc          = STATUS[req.status]

          return (
            <div key={req.id} className={`px-5 py-4 ${
              req.status === 'completed'      ? 'bg-emerald-50/30' :
              slaOverdue || afterMovein       ? 'bg-red-50/40' : ''
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{UTILITY_ICONS[req.type]}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 capitalize">{req.type}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${sc.cls}`}>
                      {sc.label}
                    </span>
                    {afterMovein && (
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                        ⚠ After move-in
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{req.provider}</p>
                </div>

                {/* SLA deadline */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-semibold ${slaOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatDate(req.slaDeadline)}
                  </p>
                  <p className={`text-xs ${slaOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                    {slaOverdue
                      ? `${Math.abs(daysToSLA)}d overdue`
                      : req.status === 'completed'
                        ? 'Done ✓'
                        : `${daysToSLA}d to deadline`}
                  </p>
                </div>

                {/* Action buttons */}
                {req.status !== 'completed' && req.status !== 'cancelled' && schedulingId !== req.id && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => setSchedulingId(req.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                      {req.scheduledDate ? 'Reschedule' : 'Schedule'}
                    </button>
                    {req.scheduledDate && req.status === 'scheduled' && (
                      <button
                        onClick={() => dispatch({ type: 'MARK_INSTALLED', caseId: c.id, reqId: req.id })}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                        Mark Done ✓
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Scheduled date info */}
              {req.scheduledDate && (
                <p className={`text-xs mt-2 ml-9 ${afterMovein ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  📅 Installation: {formatDate(req.scheduledDate)}
                  {afterMovein ? ' — AFTER move-in date!' : ''}
                  {req.installedDate ? ` · Completed ${formatDate(req.installedDate)}` : ''}
                </p>
              )}

              {/* Inline date picker */}
              {schedulingId === req.id && (
                <div className="mt-3 ml-9 flex gap-2 items-center">
                  <input type="date"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)} />
                  <button
                    onClick={() => {
                      if (!scheduleDate) return
                      dispatch({ type: 'SET_SCHEDULED_DATE', caseId: c.id, reqId: req.id, date: scheduleDate })
                      setSchedulingId(null); setScheduleDate('')
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl
                               hover:bg-indigo-700 transition-colors">
                    Save
                  </button>
                  <button onClick={() => { setSchedulingId(null); setScheduleDate('') }}
                    className="px-3 py-2 border border-gray-200 text-gray-500 text-sm rounded-xl
                               hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Activity log ──────────────────────────────────────────────────────────────

function LogSection({ c }: { c: Case }) {
  const entries = [...c.auditLog].reverse().slice(0, 8)
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">Activity Log</h2>
      </div>
      <div className="px-5 py-4">
        {!entries.length
          ? <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
          : (
            <div>
              {entries.map((e, i) => {
                const d    = new Date(e.timestamp)
                const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                return (
                  <div key={e.id} className="flex gap-3 pb-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-300 mt-1.5 flex-shrink-0" />
                      {i < entries.length - 1 && (
                        <div className="w-px flex-1 bg-gray-100 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-700">{e.action}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{time} · {date}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{e.details}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>
    </div>
  )
}

// ── AI Assistant ──────────────────────────────────────────────────────────────

type AITab = 'analysis' | 'customer' | 'vendor'

function AISection({ c }: { c: Case }) {
  const [tab, setTab]     = useState<AITab>('analysis')
  const [copied, setCopied] = useState<string | null>(null)
  const ai = c.aiInsight

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          🤖
        </div>
        <div>
          <p className="text-sm font-bold text-white">AI Ops Assistant</p>
          <p className="text-xs text-indigo-200">Powered by case intelligence</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-100 bg-gray-50">
        {([
          { key: 'analysis', label: 'Analysis'     },
          { key: 'customer', label: 'Customer Msg' },
          { key: 'vendor',   label: 'Vendor Msg'   },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              tab === t.key
                ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {tab === 'analysis' && (
          <>
            <AIBlock icon="🔍" title="Current Problem"    body={ai.currentProblem} />
            <AIBlock icon="⚠️" title="Biggest Risk"       body={ai.biggestRisk}    highlight />
            <div className="bg-indigo-600 rounded-xl p-4">
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1.5">
                → Recommended Next Action
              </p>
              <p className="text-sm text-white font-medium leading-relaxed">{ai.nextAction}</p>
            </div>
          </>
        )}
        {tab === 'customer' && (
          <MsgBlock
            title="Message to Customer"
            hint="Copy and send via WhatsApp or email"
            content={ai.customerMessage}
            onCopy={() => copy(ai.customerMessage, 'cust')}
            copied={copied === 'cust'}
          />
        )}
        {tab === 'vendor' && (
          <MsgBlock
            title="Vendor Follow-up"
            hint="Send to the utility provider"
            content={ai.vendorMessage}
            onCopy={() => copy(ai.vendorMessage, 'vend')}
            copied={copied === 'vend'}
          />
        )}
      </div>
    </div>
  )
}

function AIBlock({ icon, title, body, highlight = false }: {
  icon: string; title: string; body: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-xl p-3.5 border ${
      highlight ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'
    }`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span>{icon}</span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
    </div>
  )
}

function MsgBlock({ title, hint, content, onCopy, copied }: {
  title: string; hint: string; content: string; onCopy: () => void; copied: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-800">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
        </div>
        <button onClick={onCopy}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs text-gray-700 font-sans whitespace-pre-wrap leading-relaxed p-4
                      max-h-64 overflow-y-auto">
        {content}
      </pre>
    </div>
  )
}

// ── Exceptions ────────────────────────────────────────────────────────────────

function ExSection({ c }: { c: Case }) {
  const active = c.exceptions.filter(e => !e.resolved)
  const ICONS: Record<string, string> = {
    missing_documents:    '📄',
    overdue_request:      '⏰',
    install_after_movein: '🚨',
    date_changed:         '📅',
    duplicate_request:    '🔁',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Exceptions</h2>
        {active.length === 0
          ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              All clear ✓
            </span>
          : <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
              {active.length} active
            </span>}
      </div>
      <div className="p-4 space-y-2">
        {!active.length
          ? (
            <div className="text-center py-5">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-xs text-gray-400">No issues detected</p>
            </div>
          )
          : active.map(ex => (
            <div key={ex.id} className={`rounded-xl p-3.5 border ${
              ex.severity === 'critical'
                ? 'bg-red-50 border-red-100'
                : 'bg-amber-50 border-amber-100'
            }`}>
              <div className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0">{ICONS[ex.type] ?? '⚠'}</span>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wide ${
                    ex.severity === 'critical' ? 'text-red-600' : 'text-amber-700'
                  }`}>
                    {ex.severity}
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed mt-0.5">{ex.message}</p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

// ── Customer info card ────────────────────────────────────────────────────────

function CustomerCard({ c }: { c: Case }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">Customer</h2>
      </div>
      <div className="px-5 py-4 space-y-3">
        <CRow icon="👤" value={c.customerName} />
        <CRow icon="📧" value={c.customerEmail} />
        <CRow icon="📱" value={c.customerPhone || '—'} />
        <CRow icon="🏠" value={c.fromAddress || '—'} label="Moving from" />
        <CRow icon="📍" value={c.toAddress}           label="Moving to"   />
        <CRow icon="📅" value={`Opened ${formatDate(c.createdAt)}`} />
      </div>
    </div>
  )
}

function CRow({ icon, value, label }: { icon: string; value: string; label?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        {label && <p className="text-xs text-gray-400 leading-none mb-0.5">{label}</p>}
        <p className="text-xs text-gray-700 leading-snug break-words">{value}</p>
      </div>
    </div>
  )
}

