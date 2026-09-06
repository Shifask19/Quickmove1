import { useState } from 'react'
import type { Case, City, UtilityType } from '../types'
import type { AppState, Action, CreateCasePayload } from '../store/store'
import { PriorityBadge } from './PriorityBadge'
import { daysBetween, today } from '../engine/caseEngine'
import { CITY_PROVIDERS } from '../engine/cityProviders'

interface Props {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const CITIES: City[] = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune']
const ALL_UTILITIES: UtilityType[] = ['electricity', 'gas', 'water', 'internet', 'waste']
const UTILITY_ICONS: Record<UtilityType, string> = {
  electricity: '⚡', gas: '🔥', water: '💧', internet: '📶', waste: '🗑️',
}
const PRIORITY_ORDER = { critical: 0, warning: 1, on_track: 2 }
const emptyForm: CreateCasePayload = {
  customerName: '', customerPhone: '', customerEmail: '',
  city: 'Mumbai', fromAddress: '', toAddress: '', moveInDate: '', utilities: [],
}

export function CaseList({ state, dispatch }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateCasePayload>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCasePayload, string>>>({})

  const sorted = [...state.cases].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  function toggleUtility(u: UtilityType) {
    setForm(f => ({
      ...f,
      utilities: f.utilities.includes(u) ? f.utilities.filter(x => x !== u) : [...f.utilities, u],
    }))
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.customerName.trim()) e.customerName = 'Required'
    if (!form.customerEmail.trim()) e.customerEmail = 'Required'
    if (!form.toAddress.trim()) e.toAddress = 'Required'
    if (!form.moveInDate) e.moveInDate = 'Required'
    if (!form.utilities.length) e.utilities = 'Select at least one'
    setErrors(e)
    return !Object.keys(e).length
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    dispatch({ type: 'CREATE_CASE', payload: form })
    setForm(emptyForm); setShowForm(false); setErrors({})
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">🚚</div>
            <div>
              <p className="text-sm font-bold text-gray-900">QuickMove Ops</p>
              <p className="text-xs text-gray-400">Utility Setup · India</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1">
            <span className="text-base leading-none">+</span> New
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 mt-4">
          {[
            { count: state.cases.filter(c => c.priority === 'critical').length, label: 'Critical', color: 'text-red-600', bg: 'bg-red-50' },
            { count: state.cases.filter(c => c.priority === 'warning').length,  label: 'Warning',  color: 'text-amber-600', bg: 'bg-amber-50' },
            { count: state.cases.filter(c => c.priority === 'on_track').length, label: 'On Track', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className={`flex-1 ${s.bg} rounded-xl px-3 py-2 text-center`}>
              <div className={`text-lg font-bold ${s.color}`}>{s.count}</div>
              <div className={`text-xs font-medium ${s.color} opacity-80`}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cases label */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Cases · {sorted.length}
        </p>
      </div>

      {/* Case list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {sorted.map(c => (
          <SidebarCard
            key={c.id} c={c}
            isSelected={state.selectedCaseId === c.id}
            onClick={() => dispatch({ type: 'SELECT_CASE', id: c.id })}
          />
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[88vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-base font-bold text-gray-900">New Relocation Case</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in customer and move details</p>
              </div>
              <button onClick={() => { setShowForm(false); setErrors({}) }}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 text-xl leading-none transition-colors">×</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Customer */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer Info</p>
                <div className="space-y-2.5">
                  <FormField error={errors.customerName}>
                    <input className={fi(!!errors.customerName)} placeholder="Full name *"
                      value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
                  </FormField>
                  <input className={fi(false)} placeholder="Phone number (+91...)"
                    value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
                  <FormField error={errors.customerEmail}>
                    <input className={fi(!!errors.customerEmail)} placeholder="Email address *" type="email"
                      value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} />
                  </FormField>
                </div>
              </section>

              {/* Move */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Move Details</p>
                <div className="space-y-2.5">
                  <select className={fi(false) + ' bg-white'}
                    value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value as City, utilities: [] }))}>
                    {CITIES.map(city => <option key={city}>{city}</option>)}
                  </select>
                  <input className={fi(false)} placeholder="Moving from (city / address)"
                    value={form.fromAddress} onChange={e => setForm(f => ({ ...f, fromAddress: e.target.value }))} />
                  <FormField error={errors.toAddress}>
                    <input className={fi(!!errors.toAddress)} placeholder="Moving to — full address *"
                      value={form.toAddress} onChange={e => setForm(f => ({ ...f, toAddress: e.target.value }))} />
                  </FormField>
                  <FormField error={errors.moveInDate}>
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1">Move-in Date *</label>
                      <input type="date" className={fi(!!errors.moveInDate)}
                        value={form.moveInDate} onChange={e => setForm(f => ({ ...f, moveInDate: e.target.value }))} />
                    </div>
                  </FormField>
                </div>
              </section>

              {/* Utilities */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Utilities Required *</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_UTILITIES.map(u => {
                    const avail = !!CITY_PROVIDERS[form.city]?.[u]
                    const sel = form.utilities.includes(u)
                    return (
                      <button key={u} type="button" disabled={!avail} onClick={() => toggleUtility(u)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          !avail ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                          : sel ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/50'}`}>
                        <span>{UTILITY_ICONS[u]}</span>
                        <span className="capitalize">{u}</span>
                        {sel && <span className="ml-auto text-indigo-500">✓</span>}
                      </button>
                    )
                  })}
                </div>
                {errors.utilities && <p className="text-xs text-red-500 mt-1.5">{errors.utilities}</p>}
              </section>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setErrors({}) }}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SidebarCard({ c, isSelected, onClick }: { c: Case; isSelected: boolean; onClick: () => void }) {
  const daysToMove = daysBetween(today(), c.moveInDate)
  const activeEx = c.exceptions.filter(e => !e.resolved).length
  const docsVerified = c.documents.filter(d => d.status === 'verified').length
  const docsTotal = c.documents.length
  const pct = docsTotal > 0 ? Math.round((docsVerified / docsTotal) * 100) : 0

  const daysLabel =
    daysToMove < 0  ? `${Math.abs(daysToMove)}d ago` :
    daysToMove === 0 ? 'Today' :
    `${daysToMove}d left`

  const daysColor =
    daysToMove <= 0 ? 'text-gray-400' :
    daysToMove <= 3 ? 'text-red-500 font-semibold' :
    daysToMove <= 7 ? 'text-amber-500' : 'text-gray-400'

  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
        isSelected
          ? 'bg-indigo-50 ring-1 ring-indigo-200 shadow-sm'
          : 'hover:bg-gray-50'
      }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{c.customerName}</p>
        <span className={`text-xs flex-shrink-0 ${daysColor}`}>{daysLabel}</span>
      </div>
      <p className="text-xs text-gray-400 truncate mb-2">{c.city} · {c.toAddress.split(',')[0]}</p>
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={c.priority} />
        <div className="flex items-center gap-2">
          {activeEx > 0 && (
            <span className="text-xs text-red-500 font-medium">⚠ {activeEx}</span>
          )}
          <span className="text-xs text-gray-400">{pct}%</span>
        </div>
      </div>
      {/* Mini progress bar */}
      <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }} />
      </div>
    </button>
  )
}

function FormField({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function fi(hasError: boolean) {
  return `w-full rounded-xl px-3 py-2.5 text-sm border ${
    hasError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
  } focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-colors`
}
