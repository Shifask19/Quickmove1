import type {
  Case, City, UtilityType, Document, UtilityRequest,
  Exception, AuditEntry, AIInsight, CasePriority, DocumentStatus
} from '../types'
import { CITY_PROVIDERS } from './cityProviders'

// ─── helpers ────────────────────────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

// ─── document generation ────────────────────────────────────────────────────

export function generateDocuments(city: City, utilities: UtilityType[]): Document[] {
  const docs: Document[] = []
  const seen = new Set<string>()

  for (const util of utilities) {
    const provider = CITY_PROVIDERS[city]?.[util]
    if (!provider) continue

    for (const docName of provider.requiredDocs) {
      const key = `${util}::${docName}`
      if (seen.has(key)) continue
      seen.add(key)

      docs.push({
        id: uid(),
        name: docName,
        utility: util,
        status: 'missing',
        required: true,
      })
    }
  }
  return docs
}

// ─── utility requests ───────────────────────────────────────────────────────

export function generateUtilityRequests(
  city: City,
  utilities: UtilityType[],
  moveInDate: string
): UtilityRequest[] {
  return utilities.map((util) => {
    const provider = CITY_PROVIDERS[city]?.[util]
    const slaDays = provider?.slaDays ?? 7
    const deadline = addDays(moveInDate, -slaDays)
    const isOverdue = deadline < today()

    return {
      id: uid(),
      type: util,
      provider: provider?.name ?? 'Unknown Provider',
      requestedAt: today(),
      slaDeadline: deadline,
      status: isOverdue ? 'overdue' : 'pending',
    }
  })
}

// ─── exception detection ────────────────────────────────────────────────────

export function detectExceptions(c: Case): Exception[] {
  const exceptions: Exception[] = []
  const now = today()

  // 1. Missing documents
  const missingDocs = c.documents.filter(d => d.status === 'missing' && d.required)
  if (missingDocs.length > 0) {
    const daysToMove = daysBetween(now, c.moveInDate)
    exceptions.push({
      id: uid(),
      type: 'missing_documents',
      severity: daysToMove <= 3 ? 'critical' : 'warning',
      message: `${missingDocs.length} required document(s) still missing: ${missingDocs.map(d => d.name).slice(0, 3).join(', ')}${missingDocs.length > 3 ? '...' : ''}`,
      detectedAt: now,
      resolved: false,
    })
  }

  // 2. Overdue requests
  const overdueReqs = c.utilityRequests.filter(
    r => r.slaDeadline < now && r.status !== 'completed' && r.status !== 'cancelled'
  )
  for (const req of overdueReqs) {
    const daysLate = daysBetween(req.slaDeadline, now)
    exceptions.push({
      id: uid(),
      type: 'overdue_request',
      severity: 'critical',
      message: `${capitalize(req.type)} (${req.provider}) SLA deadline was ${formatDate(req.slaDeadline)} — ${daysLate} day(s) overdue`,
      utilityId: req.id,
      detectedAt: now,
      resolved: false,
    })
  }

  // 3. Installation scheduled after move-in date
  for (const req of c.utilityRequests) {
    if (req.scheduledDate && req.scheduledDate > c.moveInDate) {
      exceptions.push({
        id: uid(),
        type: 'install_after_movein',
        severity: 'critical',
        message: `${capitalize(req.type)} installation is scheduled for ${formatDate(req.scheduledDate)}, which is AFTER move-in on ${formatDate(c.moveInDate)}`,
        utilityId: req.id,
        detectedAt: now,
        resolved: false,
      })
    }
  }

  // 4. Rejected documents
  const rejectedDocs = c.documents.filter(d => d.status === 'rejected')
  if (rejectedDocs.length > 0) {
    exceptions.push({
      id: uid(),
      type: 'missing_documents',
      severity: 'warning',
      message: `${rejectedDocs.length} document(s) rejected and need re-upload: ${rejectedDocs.map(d => d.name).join(', ')}`,
      detectedAt: now,
      resolved: false,
    })
  }

  // 5. Move-in less than 3 days away with pending utilities
  const daysLeft = daysBetween(now, c.moveInDate)
  const pending = c.utilityRequests.filter(r => r.status === 'pending' || r.status === 'overdue')
  if (daysLeft <= 3 && daysLeft >= 0 && pending.length > 0) {
    exceptions.push({
      id: uid(),
      type: 'date_changed',
      severity: 'critical',
      message: `Move-in is in ${daysLeft} day(s) but ${pending.length} utility request(s) are still not completed`,
      detectedAt: now,
      resolved: false,
    })
  }

  return exceptions
}

// ─── priority ────────────────────────────────────────────────────────────────

export function computePriority(exceptions: Exception[]): CasePriority {
  const active = exceptions.filter(e => !e.resolved)
  if (active.some(e => e.severity === 'critical')) return 'critical'
  if (active.some(e => e.severity === 'warning')) return 'warning'
  return 'on_track'
}

// ─── AI insight ─────────────────────────────────────────────────────────────

export function generateAIInsight(c: Case): AIInsight {
  const now = today()
  const daysToMove = daysBetween(now, c.moveInDate)
  const criticals = c.exceptions.filter(e => !e.resolved && e.severity === 'critical')
  const warnings = c.exceptions.filter(e => !e.resolved && e.severity === 'warning')
  const missingDocs = c.documents.filter(d => d.status === 'missing' && d.required)
  const rejectedDocs = c.documents.filter(d => d.status === 'rejected')
  const overdueReqs = c.utilityRequests.filter(r => r.status === 'overdue')
  const pendingReqs = c.utilityRequests.filter(r => r.status === 'pending')

  // Current problem
  let currentProblem = ''
  if (criticals.length > 0) {
    currentProblem = criticals[0].message
  } else if (warnings.length > 0) {
    currentProblem = warnings[0].message
  } else if (daysToMove <= 7 && pendingReqs.length > 0) {
    currentProblem = `Move-in is in ${daysToMove} days and ${pendingReqs.length} utilities are still pending setup.`
  } else {
    currentProblem = 'No critical issues detected. Case is progressing normally.'
  }

  // Biggest risk
  let biggestRisk = ''
  if (overdueReqs.length > 0) {
    biggestRisk = `Customer may have no ${overdueReqs.map(r => r.type).join(' or ')} on move-in day — utility providers may need emergency activation which adds cost and delay.`
  } else if (missingDocs.length > 0 && daysToMove <= 5) {
    biggestRisk = `With only ${daysToMove} days to move-in, missing documents could block utility activation entirely.`
  } else if (rejectedDocs.length > 0) {
    biggestRisk = `Rejected documents will stall the provider application until re-submitted and approved.`
  } else if (daysToMove <= 2) {
    biggestRisk = `Move-in is imminent. Any delay now will directly impact the customer on day one.`
  } else {
    biggestRisk = `Low risk if current timeline is maintained. Monitor SLA deadlines.`
  }

  // Next action
  let nextAction = ''
  if (rejectedDocs.length > 0) {
    nextAction = `Re-request rejected document(s) from customer immediately: ${rejectedDocs.map(d => d.name).join(', ')}.`
  } else if (missingDocs.length > 0) {
    nextAction = `Chase customer for ${missingDocs.length} missing document(s). Start with the highest-priority utility.`
  } else if (overdueReqs.length > 0) {
    nextAction = `Call ${overdueReqs[0].provider} directly to escalate overdue ${overdueReqs[0].type} request. Log the outcome.`
  } else if (pendingReqs.length > 0) {
    nextAction = `Submit application to ${pendingReqs[0].provider} for ${pendingReqs[0].type} setup. SLA deadline: ${formatDate(pendingReqs[0].slaDeadline)}.`
  } else {
    nextAction = 'Confirm installation dates with all providers and update the scheduled dates in the system.'
  }

  // Customer message
  let customerMessage = ''
  if (missingDocs.length > 0 || rejectedDocs.length > 0) {
    const docList = [...missingDocs, ...rejectedDocs].map(d => `• ${d.name} (${d.utility})`).join('\n')
    customerMessage = `Dear ${c.customerName},\n\nTo proceed with your utility setup for your move to ${c.toAddress} on ${formatDate(c.moveInDate)}, we urgently need the following documents:\n\n${docList}\n\nPlease send these as soon as possible to avoid any delays on move-in day. You can reply to this message or upload via the portal.\n\nBest regards,\nQuickMove Operations Team`
  } else if (overdueReqs.length > 0) {
    customerMessage = `Dear ${c.customerName},\n\nWe wanted to update you that we are actively chasing ${overdueReqs.map(r => r.provider).join(' and ')} to expedite your utility setup. We will confirm your installation date within 24 hours.\n\nWe apologise for the delay and are prioritising your case.\n\nBest regards,\nQuickMove Operations Team`
  } else {
    customerMessage = `Dear ${c.customerName},\n\nGood news! Your utility setup for ${c.toAddress} is progressing well. We will confirm installation dates shortly and keep you updated.\n\nYour move-in date: ${formatDate(c.moveInDate)}.\n\nBest regards,\nQuickMove Operations Team`
  }

  // Vendor message
  const vendorTarget = overdueReqs[0] ?? pendingReqs[0]
  let vendorMessage = ''
  if (vendorTarget) {
    const urgency = overdueReqs.length > 0 ? 'URGENT: ' : ''
    vendorMessage = `${urgency}Dear ${vendorTarget.provider} Team,\n\nWe are following up on a utility connection request for our customer ${c.customerName} at ${c.toAddress}, ${c.city}.\n\nRequest type: ${capitalize(vendorTarget.type)}\nSLA deadline: ${formatDate(vendorTarget.slaDeadline)}\nCustomer move-in date: ${formatDate(c.moveInDate)}\n\nCould you please confirm the scheduled installation date and reference number? The customer will not have ${vendorTarget.type} on move-in day if this is not resolved urgently.\n\nCase reference: ${c.id.toUpperCase()}\n\nThank you,\nQuickMove Operations`
  } else {
    vendorMessage = `Dear Vendor Team,\n\nAll applications for ${c.customerName} (${c.toAddress}) are submitted and awaiting your confirmation. Please provide installation dates at your earliest convenience.\n\nCase reference: ${c.id.toUpperCase()}\n\nThank you,\nQuickMove Operations`
  }

  return { currentProblem, biggestRisk, nextAction, customerMessage, vendorMessage }
}

// ─── audit log helpers ───────────────────────────────────────────────────────

export function auditEntry(actor: string, action: string, details: string): AuditEntry {
  return { id: uid(), timestamp: new Date().toISOString(), actor, action, details }
}

// ─── full case refresh ───────────────────────────────────────────────────────

export function refreshCase(c: Case): Case {
  const exceptions = detectExceptions(c)
  const priority = computePriority(exceptions)
  const withExceptions = { ...c, exceptions, priority }
  const aiInsight = generateAIInsight(withExceptions)
  return { ...withExceptions, aiInsight }
}

// ─── utils ───────────────────────────────────────────────────────────────────

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function updateDocStatus(
  c: Case,
  docId: string,
  status: DocumentStatus,
  rejectionReason?: string
): Case {
  const documents = c.documents.map(d => {
    if (d.id !== docId) return d
    return {
      ...d,
      status,
      uploadedAt: status === 'uploaded' ? today() : d.uploadedAt,
      verifiedAt: status === 'verified' ? today() : d.verifiedAt,
      rejectionReason: status === 'rejected' ? (rejectionReason ?? 'Does not meet requirements') : undefined,
    }
  })
  return refreshCase({ ...c, documents })
}
