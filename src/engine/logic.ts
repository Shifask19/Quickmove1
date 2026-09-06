import type { ConnectionRequest, Priority, UtilityReq, RequiredDoc, LogEntry } from '../types'

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function addDays(d: string, n: number): string {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().split('T')[0]
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtBytes(b: number): string {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export function logEntry(actor: string, action: string, detail: string): LogEntry {
  return { id: uid(), ts: new Date().toISOString(), actor, action, detail }
}

// ── Priority calculation ──────────────────────────────────────────────────────

export function computePriority(conn: ConnectionRequest): Priority {
  const now = todayStr()
  const daysToSLA = daysBetween(now, conn.slaDeadline ?? conn.moveInDate)
  if (conn.status === 'completed') return 'on_track'

  const missingDocs = conn.documents.filter(d => d.status === 'missing' || d.status === 'rejected')
  const overdueUtils = conn.utilities.filter(u => u.status === 'overdue')
  const installAfterMovein = conn.utilities.some(
    u => u.scheduledDate && u.scheduledDate > conn.moveInDate
  )

  if (overdueUtils.length > 0 || installAfterMovein || (daysToSLA <= 0 && missingDocs.length > 0))
    return 'critical'
  if (missingDocs.length > 0 && daysToSLA <= 3)
    return 'critical'
  if (missingDocs.length > 0 || daysToSLA <= 7)
    return 'warning'
  return 'on_track'
}

// ── AI insight ────────────────────────────────────────────────────────────────

export interface AIInsight {
  nextAction: string
  whatsapp: string
  urgency: 'critical' | 'warning' | 'ok'
  exceptions: Array<{ severity: 'critical' | 'warning'; message: string }>
}

export function computeAI(conn: ConnectionRequest): AIInsight {
  const now = todayStr()
  const dl = daysBetween(now, conn.slaDeadline ?? conn.moveInDate)
  const missing  = conn.documents.filter(d => d.status === 'missing')
  const rejected = conn.documents.filter(d => d.status === 'rejected')
  const uploaded = conn.documents.filter(d => d.status === 'uploaded')
  const overdueUtils = conn.utilities.filter(u => u.status === 'overdue')
  const installAfter = conn.utilities.filter(u => u.scheduledDate && u.scheduledDate > conn.moveInDate)
  const exceptions: AIInsight['exceptions'] = []

  // Build exceptions list
  if (missing.length > 0) {
    exceptions.push({
      severity: (dl <= 3 || dl < 0) ? 'critical' : 'warning',
      message: `${missing.length} document(s) still missing: ${missing.map(d => d.name).slice(0, 2).join(', ')}${missing.length > 2 ? '…' : ''}`,
    })
  }
  if (rejected.length > 0) {
    exceptions.push({
      severity: 'critical',
      message: `${rejected.length} document(s) rejected — need re-upload: ${rejected.map(d => d.name).join(', ')}`,
    })
  }
  if (overdueUtils.length > 0) {
    exceptions.push({
      severity: 'critical',
      message: `${overdueUtils.map(u => `${u.type} (${u.provider})`).join(', ')} — SLA deadline passed`,
    })
  }
  if (installAfter.length > 0) {
    exceptions.push({
      severity: 'critical',
      message: `${installAfter.map(u => u.type).join(', ')} installation scheduled AFTER move-in date`,
    })
  }
  if (dl <= 3 && dl >= 0 && conn.status === 'collecting_docs') {
    exceptions.push({
      severity: 'critical',
      message: `Only ${dl} day(s) left to SLA deadline — application not yet complete`,
    })
  }

  const urgency = exceptions.some(e => e.severity === 'critical') ? 'critical'
    : exceptions.length > 0 ? 'warning' : 'ok'

  // Next action
  let nextAction = ''
  if (conn.status === 'completed') {
    nextAction = `Connection complete. Meter installed${conn.installationDate ? ' on ' + fmtDate(conn.installationDate) : ''}. No action needed.`
  } else if (conn.status === 'submitted') {
    nextAction = `Application submitted. Follow up with provider if no confirmation within 48 hours.`
  } else if (conn.status === 'ready_to_submit') {
    const mainUtil = conn.utilities[0]
    nextAction = `All documents verified ✓ — submit application to ${mainUtil?.provider ?? 'provider'} now. SLA: ${fmtDate(conn.slaDeadline ?? conn.moveInDate)}.`
  } else if (rejected.length > 0) {
    nextAction = `Re-request rejected doc(s) from customer immediately: ${rejected.map(d => d.name).join(', ')}.`
  } else if (uploaded.length > 0) {
    nextAction = `${uploaded.length} document(s) uploaded — review and verify to unblock the application.`
  } else if (missing.length > 0 && (dl <= 0 || overdueUtils.length > 0)) {
    const names = missing.slice(0, 2).map(d => d.name).join(', ')
    nextAction = `URGENT: SLA overdue. Call customer now. Still need: ${names}.`
  } else if (missing.length > 0 && dl <= 3) {
    nextAction = `Only ${dl} day(s) to SLA — chase customer now for: ${missing.slice(0, 2).map(d => d.name).join(', ')}.`
  } else if (missing.length > 0) {
    nextAction = `${missing.length} doc(s) missing. Follow up with customer for: ${missing.slice(0, 2).map(d => d.name).join(', ')}.`
  } else {
    nextAction = 'All docs verified — confirm installation date with provider.'
  }

  // WhatsApp message
  let whatsapp = ''
  const first = conn.customerName.split(' ')[0]
  const mainProv = conn.utilities[0]?.provider ?? 'the provider'
  if (conn.status === 'completed') {
    whatsapp = `Hi ${first} 👋, great news! Your electricity connection is now active. Please check your meter and let us know if anything needs attention. — QuickMove`
  } else if (conn.status === 'submitted') {
    whatsapp = `Hi ${first} 👋, your connection application has been submitted to ${mainProv}. We'll confirm your installation date shortly. Move-in: ${fmtDate(conn.moveInDate)}. — QuickMove`
  } else if (rejected.length > 0) {
    const names = rejected.map(d => `*${d.name}*`).join(', ')
    const reason = rejected[0].rejectionReason ?? 'does not meet provider requirements'
    whatsapp = `Hi ${first} 👋, we need you to re-send the following document(s): ${names}.\n\nReason: ${reason}.\n\nPlease send the corrected version as soon as possible — SLA in ${Math.max(0, dl)} days. — QuickMove`
  } else if (missing.length > 0 && dl <= 3) {
    const names = missing.map(d => `*${d.name}*`).join(', ')
    whatsapp = `Hi ${first} 👋, *urgent* — your application is blocked. We still need: ${names}.\n\nPlease send TODAY — only ${dl} day(s) left to submit. — QuickMove`
  } else if (missing.length > 0) {
    const names = missing.slice(0, 3).map(d => `*${d.name}*`).join(', ')
    whatsapp = `Hi ${first} 👋, to keep your electricity connection on track for move-in on ${fmtDate(conn.moveInDate)}, we still need: ${names}.\n\nPlease send at your earliest convenience. — QuickMove`
  } else {
    whatsapp = `Hi ${first} 👋, your electricity connection documents are all verified! We are submitting your application to ${mainProv} now. You'll hear back within 2–3 working days. — QuickMove`
  }

  return { nextAction, whatsapp, urgency, exceptions }
}

// ── SLA deadline helper ───────────────────────────────────────────────────────

export function slaDeadline(moveInDate: string, slaDays: number): string {
  return addDays(moveInDate, -slaDays)
}
