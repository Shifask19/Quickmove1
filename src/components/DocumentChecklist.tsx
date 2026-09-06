import { useState, useRef } from 'react'
import type { Case, Document, DocumentStatus, UtilityType } from '../types'
import type { Action } from '../store/store'
import { DocStatusBadge } from './DocStatusBadge'

interface Props { c: Case; dispatch: React.Dispatch<Action> }

const UTILITY_ICONS: Record<UtilityType, string> = {
  electricity: '⚡', gas: '🔥', water: '💧', internet: '📶', waste: '🗑️',
}

// Attached file info stored locally (not in Redux — files aren't serialisable)
interface AttachedFile {
  docId: string
  file: File
  previewUrl?: string   // for images
  uploadProgress: number // 0-100
  uploaded: boolean
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (['jpg','jpeg','png','webp','heic'].includes(ext ?? '')) return '🖼️'
  if (ext === 'pdf') return '📄'
  if (['doc','docx'].includes(ext ?? '')) return '📝'
  return '📎'
}

export function DocumentChecklist({ c, dispatch }: Props) {
  // Local file state — keyed by docId
  const [attached, setAttached] = useState<Record<string, AttachedFile>>({})
  const [draggingOver, setDraggingOver] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ docId: string; docName: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [viewFile, setViewFile] = useState<AttachedFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeDocIdRef = useRef<string | null>(null)

  // Simulate upload progress then mark as uploaded in store
  function simulateUpload(docId: string, file: File) {
    const isImage = file.type.startsWith('image/')
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined

    const entry: AttachedFile = { docId, file, previewUrl, uploadProgress: 0, uploaded: false }
    setAttached(prev => ({ ...prev, [docId]: entry }))

    let progress = 0
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setAttached(prev => ({
          ...prev,
          [docId]: { ...prev[docId], uploadProgress: 100, uploaded: true }
        }))
        dispatch({ type: 'UPDATE_DOC_STATUS', caseId: c.id, docId, status: 'uploaded' })
      } else {
        setAttached(prev => ({
          ...prev,
          [docId]: { ...prev[docId], uploadProgress: progress }
        }))
      }
    }, 200)
  }

  function openFilePicker(docId: string) {
    activeDocIdRef.current = docId
    fileInputRef.current?.click()
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && activeDocIdRef.current) {
      simulateUpload(activeDocIdRef.current, file)
    }
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent, docId: string) {
    e.preventDefault()
    setDraggingOver(null)
    const file = e.dataTransfer.files?.[0]
    if (file) simulateUpload(docId, file)
  }

  function removeFile(docId: string) {
    const af = attached[docId]
    if (af?.previewUrl) URL.revokeObjectURL(af.previewUrl)
    setAttached(prev => { const n = { ...prev }; delete n[docId]; return n })
    dispatch({ type: 'UPDATE_DOC_STATUS', caseId: c.id, docId, status: 'missing' })
  }

  function confirmReject() {
    if (!rejectModal) return
    dispatch({
      type: 'UPDATE_DOC_STATUS', caseId: c.id,
      docId: rejectModal.docId, status: 'rejected',
      rejectionReason: rejectReason || 'Does not meet requirements'
    })
    // Keep the file attached so ops can see what was uploaded
    setRejectModal(null); setRejectReason('')
  }

  const grouped = c.utilities.reduce<Record<UtilityType, Document[]>>((acc, u) => {
    acc[u] = c.documents.filter(d => d.utility === u); return acc
  }, {} as Record<UtilityType, Document[]>)

  const missing  = c.documents.filter(d => d.status === 'missing').length
  const uploaded = c.documents.filter(d => d.status === 'uploaded').length
  const verified = c.documents.filter(d => d.status === 'verified').length
  const rejected = c.documents.filter(d => d.status === 'rejected').length

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Hidden global file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic"
        onChange={handleFileInput}
      />

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-bold text-gray-900">Document Checklist</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {missing  > 0 && <Pill count={missing}  label="missing"  color="gray" />}
          {uploaded > 0 && <Pill count={uploaded} label="uploaded" color="blue" />}
          {verified > 0 && <Pill count={verified} label="verified" color="green" />}
          {rejected > 0 && <Pill count={rejected} label="rejected" color="red" />}
        </div>
      </div>

      {/* Per-utility groups */}
      {c.utilities.map(u => {
        const docs = grouped[u] ?? []
        if (!docs.length) return null
        const allDone = docs.every(d => d.status === 'verified')
        return (
          <div key={u} className="border-b border-gray-50 last:border-0">
            {/* Utility row */}
            <div className={`px-5 py-2.5 flex items-center gap-2 ${allDone ? 'bg-emerald-50' : 'bg-gray-50'}`}>
              <span>{UTILITY_ICONS[u]}</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${allDone ? 'text-emerald-700' : 'text-gray-500'}`}>
                {u}
              </span>
              {allDone && <span className="ml-auto text-xs text-emerald-600 font-semibold">All verified ✓</span>}
            </div>

            {/* Documents */}
            {docs.map(doc => {
              const af = attached[doc.id]
              const isDragging = draggingOver === doc.id
              const canUpload = doc.status === 'missing' || doc.status === 'rejected'
              const isUploading = af && !af.uploaded

              return (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  af={af}
                  isDragging={isDragging}
                  isUploading={isUploading ?? false}
                  canUpload={canUpload}
                  onPickFile={() => openFilePicker(doc.id)}
                  onDrop={e => handleDrop(e, doc.id)}
                  onDragOver={e => { e.preventDefault(); setDraggingOver(doc.id) }}
                  onDragLeave={() => setDraggingOver(null)}
                  onRemove={() => removeFile(doc.id)}
                  onView={() => setViewFile(af ?? null)}
                  onVerify={() => dispatch({ type: 'UPDATE_DOC_STATUS', caseId: c.id, docId: doc.id, status: 'verified' })}
                  onReject={() => setRejectModal({ docId: doc.id, docName: doc.name })}
                />
              )
            })}
          </div>
        )
      })}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">Reject Document</h3>
            <p className="text-sm text-gray-500 mb-4">"{rejectModal.docName}"</p>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder="Reason (e.g. 'Expired', 'Unregistered copy')..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File viewer modal */}
      {viewFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setViewFile(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 truncate">{viewFile.file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatBytes(viewFile.file.size)}</p>
              </div>
              <button onClick={() => setViewFile(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl">×</button>
            </div>
            <div className="p-5 flex items-center justify-center min-h-48 bg-gray-50">
              {viewFile.previewUrl
                ? <img src={viewFile.previewUrl} alt="preview"
                    className="max-h-80 max-w-full rounded-xl object-contain shadow" />
                : (
                  <div className="text-center">
                    <div className="text-5xl mb-3">{fileIcon(viewFile.file.name)}</div>
                    <p className="text-sm font-semibold text-gray-700">{viewFile.file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatBytes(viewFile.file.size)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {viewFile.file.type || 'Unknown file type'}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Single document row ───────────────────────────────────────────────────────

interface DocRowProps {
  doc: Document
  af: AttachedFile | undefined
  isDragging: boolean
  isUploading: boolean
  canUpload: boolean
  onPickFile: () => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onRemove: () => void
  onView: () => void
  onVerify: () => void
  onReject: () => void
}

function DocRow({
  doc, af, isDragging, isUploading, canUpload,
  onPickFile, onDrop, onDragOver, onDragLeave,
  onRemove, onView, onVerify, onReject
}: DocRowProps) {
  return (
    <div
      className={`px-5 py-3.5 border-b border-gray-50 last:border-0 transition-colors ${
        isDragging ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50/60'
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <StatusDot status={doc.status} />

        {/* Doc info + upload zone */}
        <div className="flex-1 min-w-0">
          {/* Name + badge */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-sm font-medium text-gray-800">{doc.name}</span>
            <DocStatusBadge status={doc.status} />
          </div>

          {/* Rejection reason */}
          {doc.status === 'rejected' && doc.rejectionReason && (
            <div className="flex items-start gap-1.5 mb-2">
              <span className="text-red-400 text-xs mt-0.5">↳</span>
              <p className="text-xs text-red-500">{doc.rejectionReason}</p>
            </div>
          )}

          {/* ── No file yet: upload zone ── */}
          {canUpload && !af && (
            <UploadZone isDragging={isDragging} onPickFile={onPickFile} />
          )}

          {/* ── Uploading: progress bar ── */}
          {af && isUploading && (
            <UploadProgress file={af.file} progress={af.uploadProgress} />
          )}

          {/* ── File attached ── */}
          {af && af.uploaded && (
            <FileChip
              af={af}
              onView={onView}
              onRemove={canUpload ? onRemove : undefined}
            />
          )}

          {/* ── Verified date ── */}
          {doc.status === 'verified' && doc.verifiedAt && (
            <p className="text-xs text-emerald-500 mt-1">✓ Verified on {doc.verifiedAt}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex flex-col gap-1.5 items-end">
          {/* Uploaded → Verify + Reject */}
          {doc.status === 'uploaded' && af?.uploaded && (
            <>
              <button onClick={onVerify}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap">
                ✓ Verify
              </button>
              <button onClick={onReject}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap">
                ✗ Reject
              </button>
            </>
          )}
          {/* Rejected → Re-upload prompt */}
          {doc.status === 'rejected' && !af?.uploaded && (
            <button onClick={onPickFile}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors whitespace-nowrap">
              Re-upload
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Upload zone (drag & drop / click) ────────────────────────────────────────

function UploadZone({ isDragging, onPickFile }: { isDragging: boolean; onPickFile: () => void }) {
  return (
    <button
      onClick={onPickFile}
      className={`mt-1 w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all text-left ${
        isDragging
          ? 'border-indigo-400 bg-indigo-50'
          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isDragging ? 'bg-indigo-100' : 'bg-gray-100'
      }`}>
        <span className="text-base">📁</span>
      </div>
      <div>
        <p className={`text-xs font-semibold ${isDragging ? 'text-indigo-600' : 'text-gray-600'}`}>
          {isDragging ? 'Drop file here' : 'Click to upload or drag & drop'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">PDF, Word, JPG, PNG — max 10 MB</p>
      </div>
      <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${
        isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-600 text-white'
      }`}>
        Upload
      </span>
    </button>
  )
}

// ── Upload progress bar ───────────────────────────────────────────────────────

function UploadProgress({ file, progress }: { file: File; progress: number }) {
  return (
    <div className="mt-1.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-lg flex-shrink-0">{fileIcon(file.name)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-700 truncate">{file.name}</p>
          <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
        </div>
        <span className="text-xs font-bold text-indigo-600 flex-shrink-0">{progress}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">Uploading…</p>
    </div>
  )
}

// ── Uploaded file chip ────────────────────────────────────────────────────────

function FileChip({ af, onView, onRemove }: {
  af: AttachedFile
  onView: () => void
  onRemove?: () => void
}) {
  return (
    <div className="mt-1.5 flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
      {/* Thumbnail or icon */}
      {af.previewUrl
        ? <img src={af.previewUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
        : <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-lg">
            {fileIcon(af.file.name)}
          </div>
      }
      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{af.file.name}</p>
        <p className="text-xs text-gray-400">{formatBytes(af.file.size)}</p>
      </div>
      {/* View */}
      <button onClick={onView}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex-shrink-0 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
        View
      </button>
      {/* Remove */}
      {onRemove && (
        <button onClick={onRemove}
          className="text-xs font-medium text-gray-400 hover:text-red-500 flex-shrink-0 px-1.5 py-1 rounded-lg hover:bg-red-50 transition-colors">
          ✕
        </button>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: DocumentStatus }) {
  const cls = {
    missing:  'bg-gray-300',
    uploaded: 'bg-blue-400',
    verified: 'bg-emerald-500',
    rejected: 'bg-red-400',
  }[status]
  return <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${cls}`} />
}

function Pill({ count, label, color }: { count: number; label: string; color: 'gray'|'blue'|'green'|'red' }) {
  const cls = {
    gray:  'bg-gray-100 text-gray-500',
    blue:  'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-700',
    red:   'bg-red-50 text-red-600',
  }[color]
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>{count} {label}</span>
}

