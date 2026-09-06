import { useState, useRef } from 'react'
import type { ConnectionRequest, RequiredDoc, DocStatus, UtilityReq } from '../types'
import type { Action } from '../store/store'
import { CONN_STATUS_LABEL } from '../store/store'
import { computeAI, fmtDate, fmtBytes, daysBetween, todayStr } from '../engine/logic'

interface Props { conn: ConnectionRequest; dispatch: React.Dispatch<Action> }

// ─────────────────────────────────────────────────────────────────────────────
export function Workspace({ conn, dispatch }: Props) {
  const ai  = computeAI(conn)
  const dl  = daysBetween(todayStr(), conn.slaDeadline ?? conn.moveInDate)
  const ver = conn.documents.filter(d => d.status === 'verified').length
  const tot = conn.documents.length
  const pct = tot > 0 ? Math.round((ver / tot) * 100) : 0

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F5F6FA]">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-7 py-4 flex-shrink-0 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-black text-base flex-shrink-0">
              {conn.customerName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black text-gray-900">{conn.customerName}</h1>
                <StatusChip status={conn.status} />
                <PriorityChip priority={conn.priority} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{conn.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 ml-12 flex-wrap">
            <span>📱 {conn.customerPhone}</span>
            <span>✉ {conn.customerEmail}</span>
            <span>📅 Move-in {fmtDate(conn.moveInDate)}</span>
            <span>🗂 #{conn.id}</span>
          </div>
        </div>
        {/* Stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatBox
            value={dl < 0 ? `${Math.abs(dl)}` : String(dl)}
            label={dl < 0 ? 'days overdue' : 'days to SLA'}
            accent={dl < 0 ? 'red' : dl <= 3 ? 'red' : dl <= 7 ? 'amber' : 'gray'}
          />
          <StatBox value={`${pct}%`} label={`${ver}/${tot} docs`} accent="indigo" />
        </div>
      </div>

      {/* ── AI action bar ────────────────────────────────────────────────── */}
      <AIBar ai={ai} conn={conn} dispatch={dispatch} />

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-7 py-5">
        <div className="max-w-6xl mx-auto">

          {/* Info strip */}
          <InfoStrip conn={conn} dl={dl} />

          {/* Main grid */}
          <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

            {/* Left column */}
            <div className="space-y-5">
              <DocChecklist conn={conn} dispatch={dispatch} />
              <UtilityTracker conn={conn} dispatch={dispatch} />
              <ActivityLog conn={conn} dispatch={dispatch} />
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <AIPanel ai={ai} conn={conn} />
              <ExceptionsPanel ai={ai} />
              <CustomerCard conn={conn} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Info strip ────────────────────────────────────────────────────────────────
function InfoStrip({ conn, dl }: { conn: ConnectionRequest; dl: number }) {
  const slaCls = dl < 0 ? 'text-red-600' : dl <= 3 ? 'text-red-500' : dl <= 7 ? 'text-amber-600' : 'text-gray-800'
  return (
    <div className="flex flex-wrap gap-3">
      {conn.utilities.map(u => (
        <InfoPill key={u.id} icon={utilIcon(u.type)} label={u.type} value={u.provider} />
      ))}
      <InfoPill icon="📅" label="SLA Deadline"
        value={<span className={slaCls + ' font-bold'}>{fmtDate(conn.slaDeadline ?? conn.moveInDate)}</span>} />
      <InfoPill icon="🏠" label="Move-in" value={fmtDate(conn.moveInDate)} />
      {conn.submittedAt && <InfoPill icon="✅" label="Submitted" value={fmtDate(conn.submittedAt)} accent />}
      {conn.installationDate && <InfoPill icon="🔌" label="Installed" value={fmtDate(conn.installationDate)} accent />}
    </div>
  )
}

function InfoPill({ icon, label, value, accent = false }: {
  icon: string; label: string; value: React.ReactNode; accent?: boolean
}) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-sm ${
      accent ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <span className="text-base">{icon}</span>
      <div>
        <p className={`text-xs font-medium ${accent ? 'text-emerald-500' : 'text-gray-400'}`}>{label}</p>
        <p className={`font-semibold text-sm leading-none mt-0.5 ${accent ? 'text-emerald-700' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  )
}

// ── AI action bar ─────────────────────────────────────────────────────────────
function AIBar({ ai, conn, dispatch }: {
  ai: ReturnType<typeof computeAI>; conn: ConnectionRequest; dispatch: React.Dispatch<Action>
}) {
  const [showMsg, setShowMsg] = useState(false)
  const [copied, setCopied]   = useState(false)

  const bg = ai.urgency === 'critical' ? 'bg-red-600' : ai.urgency === 'warning' ? 'bg-amber-500' : 'bg-indigo-600'

  function copy() {
    navigator.clipboard.writeText(ai.whatsapp).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={`${bg} px-7 py-3 flex-shrink-0 flex items-center gap-4`}>
      <span className="text-white text-sm font-bold flex-shrink-0">→</span>
      <p className="text-sm text-white font-medium flex-1 leading-snug">{ai.nextAction}</p>
      <div className="flex gap-2 flex-shrink-0">
        {conn.status === 'ready_to_submit' && (
          <button
            onClick={() => dispatch({ type: 'SET_CONN_STATUS', connId: conn.id, status: 'submitted', note: `Submitted to ${conn.utilities[0]?.provider}` })}
            className="px-3 py-1.5 bg-white text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap">
            Submit Application →
          </button>
        )}
        <button onClick={() => setShowMsg(v => !v)}
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap">
          💬 WhatsApp
        </button>
      </div>

      {/* Message drawer */}
      {showMsg && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMsg(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">WhatsApp Message</p>
                <p className="text-xs text-gray-400 mt-0.5">Copy and send to {conn.customerName}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={copy}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
                <button onClick={() => setShowMsg(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl">×</button>
              </div>
            </div>
            <pre className="p-5 text-sm text-gray-700 font-sans whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">{ai.whatsapp}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Document Checklist ────────────────────────────────────────────────────────
function DocChecklist({ conn, dispatch }: { conn: ConnectionRequest; dispatch: React.Dispatch<Action> }) {
  const miss = conn.documents.filter(d => d.status === 'missing').length
  const upl  = conn.documents.filter(d => d.status === 'uploaded').length
  const ver  = conn.documents.filter(d => d.status === 'verified').length
  const rej  = conn.documents.filter(d => d.status === 'rejected').length
  const pct  = conn.documents.length > 0 ? Math.round((ver / conn.documents.length) * 100) : 0

  return (
    <Card>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Document Checklist</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {conn.utilities.map(u => u.provider).join(' · ')}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {miss > 0 && <Pill n={miss} label="missing"  cls="bg-gray-100 text-gray-600" />}
          {rej  > 0 && <Pill n={rej}  label="rejected" cls="bg-red-50 text-red-600" />}
          {upl  > 0 && <Pill n={upl}  label="to review" cls="bg-amber-50 text-amber-700" />}
          {ver  > 0 && <Pill n={ver}  label="verified"  cls="bg-emerald-50 text-emerald-700" />}
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div className={`h-full transition-all duration-700 ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }} />
      </div>
      <div className="divide-y divide-gray-50">
        {conn.documents.map((doc, i) => (
          <DocRow key={doc.id} doc={doc} index={i + 1} connId={conn.id}
            locked={conn.status === 'completed' || conn.status === 'submitted'}
            dispatch={dispatch} />
        ))}
      </div>
    </Card>
  )
}

// ── Single doc row ────────────────────────────────────────────────────────────
function DocRow({ doc, index, connId, locked, dispatch }: {
  doc: RequiredDoc; index: number; connId: string; locked: boolean; dispatch: React.Dispatch<Action>
}) {
  const fileRef  = useRef<HTMLInputElement>(null)
  const [drag, setDrag]       = useState(false)
  const [prog, setProg]       = useState(0)
  const [uploading, setUpl]   = useState(false)
  const [localFile, setLF]    = useState<File | null>(null)
  const [preview, setPrev]    = useState<string | null>(null)
  const [viewOpen, setView]   = useState(false)
  const [rejOpen, setRej]     = useState(false)
  const [rejReason, setRejR]  = useState('')

  function startUpload(file: File) {
    if (locked) return
    setUpl(true); setProg(0); setLF(file)
    if (file.type.startsWith('image/')) {
      const r = new FileReader()
      r.onload = e => setPrev(e.target?.result as string)
      r.readAsDataURL(file)
    } else { setPrev(null) }

    let p = 0
    const iv = setInterval(() => {
      p += Math.floor(Math.random() * 22) + 8
      if (p >= 100) {
        p = 100; clearInterval(iv); setUpl(false)
        dispatch({ type: 'UPDATE_DOC', connId, docId: doc.id, patch: {
          status: 'uploaded', uploadedAt: todayStr(),
          fileName: file.name, fileSize: file.size, fileType: file.type,
        }})
      }
      setProg(Math.min(p, 100))
    }, 160)
  }

  function verify()  { dispatch({ type: 'UPDATE_DOC', connId, docId: doc.id, patch: { status: 'verified', verifiedAt: todayStr() } }) }
  function reject()  {
    dispatch({ type: 'UPDATE_DOC', connId, docId: doc.id, patch: { status: 'rejected', rejectionReason: rejReason || 'Does not meet requirements' } })
    setRej(false); setRejR('')
  }
  function remove()  {
    setPrev(null); setLF(null)
    dispatch({ type: 'UPDATE_DOC', connId, docId: doc.id, patch: { status: 'missing', fileName: undefined, fileSize: undefined, fileType: undefined } })
  }

  const showUploadZone = !uploading && !locked && (doc.status === 'missing' || doc.status === 'rejected')
  const showChip       = !uploading && doc.fileName && (doc.status === 'uploaded' || doc.status === 'verified')

  const rowBg = doc.status === 'verified' ? 'bg-emerald-50/30' : doc.status === 'rejected' ? 'bg-red-50/30' : ''

  return (
    <div className={`px-5 py-4 border-b border-gray-50 last:border-0 transition-colors ${rowBg} ${drag ? 'bg-indigo-50' : ''}`}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f && !locked) startUpload(f) }}
      onDragOver={e => { e.preventDefault(); if (!locked) setDrag(true) }}
      onDragLeave={() => setDrag(false)}>

      <input ref={fileRef} type="file" className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,.webp"
        onChange={e => { const f = e.target.files?.[0]; if (f) startUpload(f); e.target.value = '' }} />

      <div className="flex items-start gap-3">
        {/* Number + dot */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
          <DocDot status={doc.status} />
          <span className="text-xs text-gray-300 font-mono">{String(index).padStart(2,'0')}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-sm font-semibold text-gray-900">{doc.name}</span>
                <DocBadge status={doc.status} />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{doc.hint}</p>

              {/* Rejection reason */}
              {doc.status === 'rejected' && doc.rejectionReason && (
                <div className="mt-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-start gap-1.5">
                  <span className="text-red-400 text-xs flex-shrink-0 mt-0.5">↳</span>
                  <p className="text-xs text-red-600 font-medium">{doc.rejectionReason}</p>
                </div>
              )}

              {/* Upload zone */}
              {showUploadZone && (
                <button onClick={() => fileRef.current?.click()}
                  className={`mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all text-left ${
                    drag ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                  }`}>
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-base flex-shrink-0">📁</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600">{drag ? 'Drop here' : 'Click to upload or drag & drop'}</p>
                    <p className="text-xs text-gray-400">PDF, Word, JPG, PNG · max 10 MB</p>
                  </div>
                  <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0">Upload</span>
                </button>
              )}

              {/* Progress */}
              {uploading && localFile && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-base">{fileIcon(localFile.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{localFile.name}</p>
                      <p className="text-xs text-gray-400">{fmtBytes(localFile.size)}</p>
                    </div>
                    <span className="text-xs font-black text-indigo-600">{prog}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-200" style={{ width: `${prog}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Uploading…</p>
                </div>
              )}

              {/* File chip */}
              {showChip && (
                <div className="mt-3 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                  {preview
                    ? <img src={preview} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xl flex-shrink-0">{fileIcon(doc.fileType)}</div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{doc.fileName}</p>
                    <p className="text-xs text-gray-400">
                      {doc.fileSize ? fmtBytes(doc.fileSize) : ''}
                      {doc.uploadedAt ? ` · ${doc.uploadedAt}` : ''}
                      {doc.verifiedAt ? ` · ✓ verified ${doc.verifiedAt}` : ''}
                    </p>
                  </div>
                  <button onClick={() => setView(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex-shrink-0">View</button>
                  {!locked && doc.status !== 'verified' && (
                    <button onClick={remove}
                      className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">✕</button>
                  )}
                </div>
              )}
            </div>

            {/* Verify / Reject */}
            {!locked && !uploading && doc.status === 'uploaded' && (
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button onClick={verify}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors whitespace-nowrap">✓ Verify</button>
                <button onClick={() => setRej(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap">✗ Reject</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File viewer modal */}
      {viewOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8" onClick={() => setView(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.fileName} · {doc.fileSize ? fmtBytes(doc.fileSize) : ''}</p>
              </div>
              <button onClick={() => setView(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl">×</button>
            </div>
            <div className="p-6 flex items-center justify-center bg-gray-50 min-h-48">
              {preview
                ? <img src={preview} alt="preview" className="max-h-80 max-w-full rounded-xl shadow-md object-contain" />
                : <div className="text-center">
                    <div className="text-5xl mb-3">{fileIcon(doc.fileType)}</div>
                    <p className="text-sm font-semibold text-gray-700">{doc.fileName}</p>
                    <p className="text-xs text-gray-400 mt-1">{doc.fileType || 'Document'}</p>
                    {doc.status === 'verified' && <p className="text-xs text-emerald-600 font-semibold mt-2">✓ Verified {doc.verifiedAt}</p>}
                  </div>}
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRej(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-1">Reject Document</h3>
            <p className="text-sm text-gray-500 mb-4">"{doc.name}"</p>
            <textarea autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Reason — e.g. 'Unregistered copy', 'Expired', 'Wrong address'…"
              value={rejReason} onChange={e => setRejR(e.target.value)} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRej(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={reject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Utility Tracker ───────────────────────────────────────────────────────────
function UtilityTracker({ conn, dispatch }: { conn: ConnectionRequest; dispatch: React.Dispatch<Action> }) {
  const [schedulingId, setSched] = useState<string | null>(null)
  const [schedDate, setSchedD]   = useState('')

  const STATUS_CLS: Record<UtilityReq['status'], string> = {
    pending:   'bg-gray-100 text-gray-600',
    scheduled: 'bg-blue-50 text-blue-700',
    completed: 'bg-emerald-50 text-emerald-700',
    overdue:   'bg-red-50 text-red-700',
  }

  return (
    <Card>
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">Utility Requests &amp; SLA</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {conn.utilities.map(u => {
          const dl         = daysBetween(todayStr(), u.slaDeadline)
          const slaOverdue = u.slaDeadline < todayStr() && u.status !== 'completed'
          const afterMove  = u.scheduledDate && u.scheduledDate > conn.moveInDate

          return (
            <div key={u.id} className={`px-5 py-4 ${u.status === 'overdue' || afterMove ? 'bg-red-50/40' : u.status === 'completed' ? 'bg-emerald-50/30' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{utilIcon(u.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 capitalize">{u.type}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${STATUS_CLS[u.status]}`}>
                      {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                    </span>
                    {afterMove && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">⚠ After move-in</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{u.provider}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-bold ${slaOverdue ? 'text-red-600' : 'text-gray-700'}`}>{fmtDate(u.slaDeadline)}</p>
                  <p className={`text-xs ${slaOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                    {slaOverdue ? `${Math.abs(dl)}d overdue` : u.status === 'completed' ? 'Done ✓' : `${dl}d left`}
                  </p>
                </div>
                {u.status !== 'completed' && schedulingId !== u.id && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => setSched(u.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors whitespace-nowrap">
                      {u.scheduledDate ? 'Reschedule' : 'Schedule'}
                    </button>
                    {u.scheduledDate && u.status === 'scheduled' && (
                      <button onClick={() => dispatch({ type: 'COMPLETE_UTIL', connId: conn.id, utilId: u.id })}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap">
                        Mark Done ✓
                      </button>
                    )}
                  </div>
                )}
              </div>

              {u.scheduledDate && (
                <p className={`text-xs mt-2 ml-9 ${afterMove ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  📅 Installation: {fmtDate(u.scheduledDate)}
                  {afterMove ? ' — AFTER move-in!' : ''}
                  {u.installedAt ? ` · Completed ${fmtDate(u.installedAt)}` : ''}
                </p>
              )}

              {schedulingId === u.id && (
                <div className="mt-3 ml-9 flex gap-2 items-center">
                  <input type="date" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={schedDate} onChange={e => setSchedD(e.target.value)} />
                  <button
                    onClick={() => {
                      if (!schedDate) return
                      dispatch({ type: 'SCHEDULE_UTIL', connId: conn.id, utilId: u.id, date: schedDate })
                      setSched(null); setSchedD('')
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700">Save</button>
                  <button onClick={() => { setSched(null); setSchedD('') }}
                    className="px-3 py-2 border border-gray-200 text-gray-500 text-sm rounded-xl hover:bg-gray-50">Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Activity Log ──────────────────────────────────────────────────────────────
function ActivityLog({ conn, dispatch }: { conn: ConnectionRequest; dispatch: React.Dispatch<Action> }) {
  const [note, setNote] = useState('')
  const entries = [...conn.log].reverse()

  function addNote() {
    const t = note.trim()
    if (!t) return
    dispatch({ type: 'ADD_NOTE', connId: conn.id, note: t })
    setNote('')
  }

  return (
    <Card>
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">Activity Log</h2>
      </div>
      {/* Add note */}
      <div className="px-5 pt-4 pb-3 flex gap-2">
        <input
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Add a note…"
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNote()}
        />
        <button onClick={addNote}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors flex-shrink-0">
          Add
        </button>
      </div>
      <div className="px-5 pb-4 space-y-0">
        {entries.length === 0
          ? <p className="text-xs text-gray-400 text-center py-3">No activity yet</p>
          : entries.map((e, i) => {
              const d    = new Date(e.ts)
              const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
              return (
                <div key={e.id} className="flex gap-3 pb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-300 mt-1.5 flex-shrink-0" />
                    {i < entries.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-800">{e.action}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{time} · {date}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{e.detail}</p>
                  </div>
                </div>
              )
            })}
      </div>
    </Card>
  )
}

// ── AI Panel ──────────────────────────────────────────────────────────────────
function AIPanel({ ai, conn }: { ai: ReturnType<typeof computeAI>; conn: ConnectionRequest }) {
  const [tab, setTab]       = useState<'analysis' | 'customer' | 'vendor'>('analysis')
  const [copied, setCopied] = useState(false)

  const vendorMsg = conn.utilities.length > 0
    ? `Dear ${conn.utilities[0].provider} Team,\n\nFollowing up on a utility connection for ${conn.customerName} at ${conn.address}.\n\nRequest: ${conn.utilities.map(u => u.type).join(', ')}\nSLA deadline: ${fmtDate(conn.slaDeadline ?? conn.moveInDate)}\nMove-in: ${fmtDate(conn.moveInDate)}\nRef: ${conn.id}\n\nKindly confirm installation date at your earliest.\n\nThank you,\nQuickMove Operations`
    : ''

  const msgText = tab === 'customer' ? ai.whatsapp : vendorMsg

  function copy() {
    navigator.clipboard.writeText(msgText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Card>
      <div className="px-4 py-4 bg-gradient-to-br from-indigo-600 to-indigo-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🤖</div>
          <div>
            <p className="text-sm font-bold text-white">AI Ops Assistant</p>
            <p className="text-xs text-indigo-200">Live case intelligence</p>
          </div>
        </div>
      </div>
      <div className="flex border-b border-gray-100 bg-gray-50">
        {(['analysis','customer','vendor'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors capitalize ${
              tab === t ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'
            }`}>{t === 'analysis' ? 'Analysis' : t === 'customer' ? 'Customer Msg' : 'Vendor Msg'}</button>
        ))}
      </div>
      <div className="p-4 space-y-3">
        {tab === 'analysis' && (
          <>
            <AIBlock icon="🔍" title="What's happening" body={
              ai.exceptions.length > 0 ? ai.exceptions[0].message : 'Case is progressing normally.'
            } />
            <AIBlock icon="⚠️" title="Biggest risk" body={
              ai.urgency === 'critical' ? 'Customer may not have utilities active on move-in day if action is not taken today.'
              : ai.urgency === 'warning'  ? 'Delays in document collection could push the SLA deadline.'
              : 'Low risk. Stay on track and confirm installation dates.'
            } highlight={ai.urgency !== 'ok'} />
            <div className="bg-indigo-600 rounded-xl p-4">
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1.5">→ Next Action</p>
              <p className="text-sm text-white font-medium leading-relaxed">{ai.nextAction}</p>
            </div>
          </>
        )}
        {(tab === 'customer' || tab === 'vendor') && (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-800">{tab === 'customer' ? 'Message to Customer' : 'Vendor Follow-up'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{tab === 'customer' ? 'Copy and send via WhatsApp / email' : `Send to ${conn.utilities[0]?.provider ?? 'provider'}`}</p>
              </div>
              <button onClick={copy}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 text-xs text-gray-700 font-sans whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">{msgText}</pre>
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Exceptions Panel ──────────────────────────────────────────────────────────
function ExceptionsPanel({ ai }: { ai: ReturnType<typeof computeAI> }) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Exceptions</h2>
        {ai.exceptions.length === 0
          ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">All clear ✓</span>
          : <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">{ai.exceptions.length} active</span>}
      </div>
      <div className="p-4 space-y-2">
        {ai.exceptions.length === 0
          ? <div className="text-center py-5"><div className="text-3xl mb-2">✅</div><p className="text-xs text-gray-400">No issues detected</p></div>
          : ai.exceptions.map((ex, i) => (
            <div key={i} className={`rounded-xl p-3.5 border ${ex.severity === 'critical' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${ex.severity === 'critical' ? 'text-red-600' : 'text-amber-700'}`}>{ex.severity}</p>
              <p className="text-xs text-gray-700 leading-relaxed">{ex.message}</p>
            </div>
          ))}
      </div>
    </Card>
  )
}

// ── Customer Card ─────────────────────────────────────────────────────────────
function CustomerCard({ conn }: { conn: ConnectionRequest }) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-bold text-gray-900">Customer</h2></div>
      <div className="px-5 py-4 space-y-2.5">
        <CRow icon="👤" label={conn.customerName} />
        <CRow icon="📧" label={conn.customerEmail} />
        <CRow icon="📱" label={conn.customerPhone || '—'} />
        <CRow icon="📍" label={conn.address} sub="Address" />
        <CRow icon="🏙" label={conn.city} sub="City" />
        <CRow icon="📅" label={`Case opened ${conn.createdAt}`} />
      </div>
    </Card>
  )
}

// ── Micro helpers ─────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">{children}</div>
}

function Pill({ n, label, cls }: { n: number; label: string; cls: string }) {
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>{n} {label}</span>
}

function AIBlock({ icon, title, body, highlight = false }: { icon: string; title: string; body: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3.5 border ${highlight ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span>{icon}</span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
    </div>
  )
}

function CRow({ icon, label, sub }: { icon: string; label: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        {sub && <p className="text-xs text-gray-400 leading-none mb-0.5">{sub}</p>}
        <p className="text-xs text-gray-700 break-words leading-snug">{label}</p>
      </div>
    </div>
  )
}

function DocDot({ status }: { status: DocStatus }) {
  const cls: Record<DocStatus, string> = {
    missing:   'bg-gray-300',
    uploading: 'bg-blue-400 animate-pulse',
    uploaded:  'bg-amber-400',
    verified:  'bg-emerald-500',
    rejected:  'bg-red-400',
  }
  return <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cls[status]}`} />
}

function DocBadge({ status }: { status: DocStatus }) {
  const cfg: Record<DocStatus, { label: string; cls: string }> = {
    missing:   { label: 'Missing',   cls: 'bg-gray-100 text-gray-500' },
    uploading: { label: 'Uploading', cls: 'bg-blue-50 text-blue-600' },
    uploaded:  { label: 'Uploaded',  cls: 'bg-amber-50 text-amber-700' },
    verified:  { label: 'Verified',  cls: 'bg-emerald-50 text-emerald-700' },
    rejected:  { label: 'Rejected',  cls: 'bg-red-50 text-red-600' },
  }
  const { label, cls } = cfg[status]
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${cls}`}>{label}</span>
}

function StatusChip({ status }: { status: ConnectionRequest['status'] }) {
  const cfg = {
    collecting_docs: 'bg-amber-100 text-amber-700',
    ready_to_submit: 'bg-indigo-100 text-indigo-700',
    submitted:       'bg-blue-100 text-blue-700',
    scheduled:       'bg-teal-100 text-teal-700',
    completed:       'bg-emerald-100 text-emerald-700',
  }[status]
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg}`}>{CONN_STATUS_LABEL[status]}</span>
}

function PriorityChip({ priority }: { priority: ConnectionRequest['priority'] }) {
  const cfg = {
    critical: 'bg-red-100 text-red-700',
    warning:  'bg-amber-100 text-amber-700',
    on_track: 'bg-emerald-100 text-emerald-700',
  }[priority]
  const label = { critical: '🔴 Critical', warning: '🟡 Warning', on_track: '🟢 On Track' }[priority]
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg}`}>{label}</span>
}

function StatBox({ value, label, accent }: { value: string; label: string; accent: 'red' | 'amber' | 'indigo' | 'gray' }) {
  const cls = { red: 'text-red-600 bg-red-50 border-red-200', amber: 'text-amber-600 bg-amber-50 border-amber-200', indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200', gray: 'text-gray-700 bg-gray-50 border-gray-200' }[accent]
  return (
    <div className={`px-4 py-3 rounded-2xl border text-center min-w-[88px] ${cls}`}>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="text-xs font-semibold mt-0.5">{label}</p>
    </div>
  )
}

function utilIcon(type: string) {
  return ({ electricity: '⚡', gas: '🔥', water: '💧', internet: '📶', waste: '🗑️' })[type] ?? '🔧'
}

function fileIcon(type = '') {
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  if (type.includes('word')) return '📝'
  return '📎'
}
