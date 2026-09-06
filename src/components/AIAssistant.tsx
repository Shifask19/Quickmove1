import { useState } from 'react'
import type { Case } from '../types'
import { PriorityBadge } from './PriorityBadge'

interface Props {
  c: Case
  onClose: () => void
}

type Tab = 'analysis' | 'customer_msg' | 'vendor_msg'

export function AIAssistant({ c, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('analysis')
  const [copied, setCopied] = useState<string | null>(null)
  const ai = c.aiInsight

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h2 className="text-sm font-bold text-white">AI Ops Assistant</h2>
              <p className="text-xs text-indigo-200">{c.customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white text-xl font-light">×</button>
        </div>

        {/* Priority */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <span className="text-xs text-slate-500">Case priority:</span>
          <PriorityBadge priority={c.priority} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {([
            { key: 'analysis', label: '🧠 Analysis' },
            { key: 'customer_msg', label: '✉ Customer' },
            { key: 'vendor_msg', label: '📞 Vendor' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                tab === t.key
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {tab === 'analysis' && (
            <>
              <InsightCard
                icon="🔴"
                title="Current Problem"
                content={ai.currentProblem}
              />
              <InsightCard
                icon="⚠️"
                title="Biggest Risk"
                content={ai.biggestRisk}
                highlight
              />
              <div className="bg-indigo-600 text-white rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>➡️</span>
                  <span className="text-xs font-bold uppercase tracking-wide text-indigo-200">What to do next</span>
                </div>
                <p className="text-sm font-medium leading-relaxed">{ai.nextAction}</p>
              </div>
            </>
          )}

          {tab === 'customer_msg' && (
            <MessageCard
              title="Customer Message"
              subtitle="Copy and send via email or WhatsApp"
              content={ai.customerMessage}
              onCopy={() => copyText(ai.customerMessage, 'customer')}
              copied={copied === 'customer'}
            />
          )}

          {tab === 'vendor_msg' && (
            <MessageCard
              title="Vendor Follow-up"
              subtitle="Send to utility provider"
              content={ai.vendorMessage}
              onCopy={() => copyText(ai.vendorMessage, 'vendor')}
              copied={copied === 'vendor'}
            />
          )}
        </div>

        {/* Exceptions summary at bottom */}
        {c.exceptions.filter(e => !e.resolved).length > 0 && (
          <div className="border-t border-slate-200 px-5 py-3 bg-red-50">
            <p className="text-xs font-semibold text-red-700 mb-1.5">
              ⚠ {c.exceptions.filter(e => !e.resolved).length} Active Exception(s)
            </p>
            {c.exceptions.filter(e => !e.resolved).slice(0, 2).map(ex => (
              <p key={ex.id} className="text-xs text-red-600 leading-relaxed mb-0.5">• {ex.message}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InsightCard({ icon, title, content, highlight = false }: {
  icon: string; title: string; content: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</span>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
    </div>
  )
}

function MessageCard({ title, subtitle, content, onCopy, copied }: {
  title: string; subtitle: string; content: string; onCopy: () => void; copied: boolean
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <button
          onClick={onCopy}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            copied
              ? 'border-emerald-400 text-emerald-600 bg-emerald-50'
              : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <div className="px-4 py-4">
        <pre className="text-sm text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">{content}</pre>
      </div>
    </div>
  )
}
