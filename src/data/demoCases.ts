import type { Case, Document, UtilityRequest } from '../types'
import {
  uid, addDays, today, generateDocuments,
  generateUtilityRequests, refreshCase, auditEntry
} from '../engine/caseEngine'

function makeCase(overrides: Partial<Case> & {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  city: Case['city']
  fromAddress: string
  toAddress: string
  moveInDate: string
  createdAt: string
  utilities: Case['utilities']
  docOverrides?: (docs: Document[]) => Document[]
  reqOverrides?: (reqs: UtilityRequest[]) => UtilityRequest[]
}): Case {
  const {
    docOverrides, reqOverrides,
    utilities, city, moveInDate, createdAt,
    ...rest
  } = overrides

  let documents = generateDocuments(city, utilities)
  if (docOverrides) documents = docOverrides(documents)

  let utilityRequests = generateUtilityRequests(city, utilities, moveInDate)
  if (reqOverrides) utilityRequests = reqOverrides(utilityRequests)

  const base: Case = {
    exceptions: [],
    auditLog: [],
    priority: 'on_track',
    aiInsight: {
      currentProblem: '',
      biggestRisk: '',
      nextAction: '',
      customerMessage: '',
      vendorMessage: '',
    },
    status: 'active',
    utilities,
    city,
    moveInDate,
    createdAt,
    documents,
    utilityRequests,
    ...rest,
  }

  return refreshCase({
    ...base,
    auditLog: [
      auditEntry('System', 'Case Created', `Case created for ${overrides.customerName} moving to ${overrides.city}`),
    ],
  })
}

// ─── Case 1: CRITICAL — Mumbai, move-in tomorrow, all docs missing ───────────
const case1 = makeCase({
  id: 'qm-1001',
  customerName: 'Rahul Sharma',
  customerPhone: '+91 98201 45678',
  customerEmail: 'rahul.sharma@gmail.com',
  city: 'Mumbai',
  fromAddress: 'Andheri West, Mumbai',
  toAddress: 'Bandra Kurla Complex, Apt 704, Mumbai 400051',
  moveInDate: addDays(today(), 1),
  createdAt: addDays(today(), -10),
  utilities: ['electricity', 'water', 'internet'],
  // All docs missing — critical state
})

// ─── Case 2: CRITICAL — Delhi, electricity scheduled after move-in ───────────
const case2 = makeCase({
  id: 'qm-1002',
  customerName: 'Priya Nair',
  customerPhone: '+91 99110 78234',
  customerEmail: 'priya.nair@outlook.com',
  city: 'Delhi',
  fromAddress: 'Noida Sector 62, UP',
  toAddress: 'Vasant Kunj, Block C, Flat 12B, New Delhi 110070',
  moveInDate: addDays(today(), 4),
  createdAt: addDays(today(), -12),
  utilities: ['electricity', 'gas', 'internet'],
  docOverrides: docs => docs.map(d => ({
    ...d,
    status: d.name.includes('Aadhaar') ? 'verified' as const
           : d.name.includes('Rent Agreement') ? 'verified' as const
           : 'uploaded' as const,
    uploadedAt: addDays(today(), -5),
    verifiedAt: d.name.includes('Aadhaar') || d.name.includes('Rent Agreement')
      ? addDays(today(), -3) : undefined,
  })),
  reqOverrides: reqs => reqs.map(r => ({
    ...r,
    status: 'scheduled' as const,
    // Electricity scheduled 2 days AFTER move-in — triggers exception
    scheduledDate: r.type === 'electricity'
      ? addDays(today(), 6)
      : addDays(today(), 3),
  })),
})

// ─── Case 3: WARNING — Bangalore, one doc rejected, gas still pending ────────
const case3 = makeCase({
  id: 'qm-1003',
  customerName: 'Suresh Menon',
  customerPhone: '+91 94487 23019',
  customerEmail: 'suresh.menon@infosys.com',
  city: 'Bangalore',
  fromAddress: 'Mysore Road, Bangalore',
  toAddress: 'Whitefield, Prestige Tech Park Apts, Flat 301, Bangalore 560066',
  moveInDate: addDays(today(), 9),
  createdAt: addDays(today(), -8),
  utilities: ['electricity', 'water', 'gas', 'internet'],
  docOverrides: docs => docs.map((d, i) => {
    if (i === 0) return { ...d, status: 'verified' as const, uploadedAt: addDays(today(), -5), verifiedAt: addDays(today(), -2) }
    if (i === 1) return {
      ...d, status: 'rejected' as const, uploadedAt: addDays(today(), -4),
      rejectionReason: 'Rent Agreement not registered — please provide registered copy from Sub-Registrar office'
    }
    if (i === 2) return { ...d, status: 'uploaded' as const, uploadedAt: addDays(today(), -3) }
    return d
  }),
  reqOverrides: reqs => reqs.map(r => ({
    ...r,
    status: r.type === 'electricity' ? 'scheduled' as const : 'pending' as const,
    scheduledDate: r.type === 'electricity' ? addDays(today(), 7) : undefined,
  })),
})

// ─── Case 4: ON TRACK — Hyderabad, all docs verified, installations booked ───
const case4 = makeCase({
  id: 'qm-1004',
  customerName: 'Deepa Reddy',
  customerPhone: '+91 96661 30045',
  customerEmail: 'deepa.reddy@tcs.com',
  city: 'Hyderabad',
  fromAddress: 'Secunderabad, Telangana',
  toAddress: 'Hitech City, Cyber Towers Residency, Flat 8A, Hyderabad 500081',
  moveInDate: addDays(today(), 14),
  createdAt: addDays(today(), -15),
  utilities: ['electricity', 'gas', 'internet'],
  docOverrides: docs => docs.map(d => ({
    ...d,
    status: 'verified' as const,
    uploadedAt: addDays(today(), -10),
    verifiedAt: addDays(today(), -7),
  })),
  reqOverrides: reqs => reqs.map(r => ({
    ...r,
    status: 'scheduled' as const,
    scheduledDate: addDays(today(), 10),
  })),
})

// ─── Case 5: WARNING — Chennai, SLA overdue, docs partially done ─────────────
const case5 = makeCase({
  id: 'qm-1005',
  customerName: 'Arjun Krishnamurthy',
  customerPhone: '+91 98412 67890',
  customerEmail: 'arjun.k@wipro.com',
  city: 'Chennai',
  fromAddress: 'Coimbatore, Tamil Nadu',
  toAddress: 'OMR IT Corridor, Sholinganallur, Flat 502, Chennai 600119',
  moveInDate: addDays(today(), 5),
  createdAt: addDays(today(), -20),
  utilities: ['electricity', 'water', 'internet', 'waste'],
  docOverrides: docs => docs.map((d, i) => {
    if (i % 2 === 0) return { ...d, status: 'verified' as const, uploadedAt: addDays(today(), -10), verifiedAt: addDays(today(), -7) }
    return d // odd ones stay missing
  }),
  reqOverrides: reqs => reqs.map(r => ({
    ...r,
    slaDeadline: addDays(today(), -2), // force overdue
    status: 'overdue' as const,
  })),
})

// ─── Case 6: WARNING — Pune, recently created, only Aadhaar uploaded ─────────
const case6 = makeCase({
  id: 'qm-1006',
  customerName: 'Sneha Kulkarni',
  customerPhone: '+91 95527 11234',
  customerEmail: 'sneha.kulkarni@gmail.com',
  city: 'Pune',
  fromAddress: 'Nashik, Maharashtra',
  toAddress: 'Hinjewadi IT Park, Phase 2, Apt 210, Pune 411057',
  moveInDate: addDays(today(), 12),
  createdAt: addDays(today(), -3),
  utilities: ['electricity', 'water', 'internet'],
  docOverrides: docs => docs.map((d, i) => {
    // Only the first Aadhaar doc uploaded so far
    if (i === 0) return { ...d, status: 'uploaded' as const, uploadedAt: addDays(today(), -1) }
    return d
  }),
})

export const DEMO_CASES: Case[] = [case1, case2, case3, case4, case5, case6]
