import type { ConnectionRequest } from '../types'
import { addDays, todayStr } from '../engine/logic'

const T = todayStr()

export const CONNECTIONS: ConnectionRequest[] = [

  // 1. CRITICAL — 2 days to SLA, doc rejected, 3 missing
  {
    id: 'BLR-2841', createdAt: addDays(T, -10),
    customerName: 'Suresh Menon', customerPhone: '+91 94487 23019',
    customerEmail: 'suresh.menon@infosys.com',
    address: 'Flat 301, Prestige Tech Park Apts, Whitefield, Bangalore 560066',
    city: 'Bangalore', moveInDate: addDays(T, 9),
    slaDeadline: addDays(T, 2), status: 'collecting_docs', priority: 'critical',
    notes: [],
    log: [
      { id: '1', ts: addDays(T, -10) + 'T09:00:00Z', actor: 'System', action: 'Case Created', detail: 'Suresh Menon — Bangalore — electricity' },
      { id: '2', ts: addDays(T, -5) + 'T11:00:00Z', actor: 'Ops', action: 'Document Uploaded', detail: '"Aadhaar Card copy" → uploaded' },
      { id: '3', ts: addDays(T, -4) + 'T14:00:00Z', actor: 'Ops', action: 'Document Rejected', detail: '"Rent Agreement" → Unregistered copy — Sub-Registrar stamp required' },
    ],
    utilities: [
      { id: 'u1', type: 'electricity', provider: 'BESCOM', slaDeadline: addDays(T, 2), status: 'pending' },
    ],
    documents: [
      { id: 'd1', name: 'Aadhaar Card copy', hint: 'Both sides, legible.', status: 'verified', uploadedAt: addDays(T, -5), verifiedAt: addDays(T, -3), fileName: 'aadhaar_suresh.pdf', fileSize: 420000, fileType: 'application/pdf' },
      { id: 'd2', name: 'Rent Agreement (registered)', hint: 'Must have Sub-Registrar stamp.', status: 'rejected', uploadedAt: addDays(T, -4), rejectionReason: 'Unregistered copy — BESCOM requires Sub-Registrar stamp', fileName: 'rent_agreement.pdf', fileSize: 890000, fileType: 'application/pdf' },
      { id: 'd3', name: 'Previous electricity bill', hint: "Owner's BESCOM bill for this address.", status: 'missing' },
      { id: 'd4', name: 'Passport-size photograph', hint: 'Colour photo, white background.', status: 'missing' },
      { id: 'd5', name: 'BESCOM application form', hint: 'Download from bescom.org, fill and sign.', status: 'uploaded', uploadedAt: addDays(T, -2), fileName: 'bescom_form.pdf', fileSize: 310000, fileType: 'application/pdf' },
    ],
  },

  // 2. WARNING — docs partially collected, SLA in 5 days
  {
    id: 'MUM-1193', createdAt: addDays(T, -8),
    customerName: 'Priya Sharma', customerPhone: '+91 98201 45678',
    customerEmail: 'priya.sharma@gmail.com',
    address: 'Apt 12B, Raheja Towers, Bandra West, Mumbai 400050',
    city: 'Mumbai', moveInDate: addDays(T, 12),
    slaDeadline: addDays(T, 5), status: 'collecting_docs', priority: 'warning',
    notes: ['Customer confirmed she will send remaining docs today.'],
    log: [
      { id: '1', ts: addDays(T, -8) + 'T10:00:00Z', actor: 'System', action: 'Case Created', detail: 'Priya Sharma — Mumbai' },
      { id: '2', ts: addDays(T, -3) + 'T09:30:00Z', actor: 'Ops', action: 'Document Uploaded', detail: '"Aadhaar Card copy" → uploaded' },
      { id: '3', ts: addDays(T, -1) + 'T15:00:00Z', actor: 'Ops', action: 'Document Uploaded', detail: '"Rent Agreement" → uploaded' },
    ],
    utilities: [
      { id: 'u1', type: 'electricity', provider: 'Adani Electricity', slaDeadline: addDays(T, 5), status: 'pending' },
      { id: 'u2', type: 'gas', provider: 'Mahanagar Gas (MGL)', slaDeadline: addDays(T, 4), status: 'pending' },
    ],
    documents: [
      { id: 'd1', name: 'Aadhaar Card copy', hint: 'Both sides.', status: 'verified', uploadedAt: addDays(T, -3), verifiedAt: addDays(T, -1), fileName: 'aadhaar.jpg', fileSize: 280000, fileType: 'image/jpeg' },
      { id: 'd2', name: 'Rent Agreement (registered)', hint: 'Registered copy.', status: 'uploaded', uploadedAt: addDays(T, -1), fileName: 'rent_agreement.pdf', fileSize: 1200000, fileType: 'application/pdf' },
      { id: 'd3', name: 'Previous electricity bill', hint: "Owner's last bill showing address.", status: 'missing' },
      { id: 'd4', name: 'Passport-size photograph', hint: 'Recent colour photo, white background.', status: 'missing' },
    ],
  },

  // 3. ON TRACK — all docs verified, ready to submit
  {
    id: 'DEL-0472', createdAt: addDays(T, -15),
    customerName: 'Anjali Kapoor', customerPhone: '+91 99110 78234',
    customerEmail: 'anjali.kapoor@outlook.com',
    address: 'Flat 12B, Vasant Kunj Block C, New Delhi 110070',
    city: 'Delhi', moveInDate: addDays(T, 14),
    slaDeadline: addDays(T, 7), status: 'ready_to_submit', priority: 'on_track',
    notes: ['All documents verified. Ready to submit to BSES.'],
    log: [
      { id: '1', ts: addDays(T, -15) + 'T08:00:00Z', actor: 'System', action: 'Case Created', detail: 'Anjali Kapoor — Delhi' },
      { id: '2', ts: addDays(T, -8) + 'T10:00:00Z', actor: 'Ops', action: 'Document Verified', detail: 'All documents verified — status → ready_to_submit' },
    ],
    utilities: [
      { id: 'u1', type: 'electricity', provider: 'BSES Rajdhani / Tata Power Delhi', slaDeadline: addDays(T, 7), status: 'pending' },
      { id: 'u2', type: 'internet', provider: 'Jio Fiber / Airtel / ACT Fibernet', slaDeadline: addDays(T, 10), status: 'pending' },
    ],
    documents: [
      { id: 'd1', name: 'Aadhaar Card copy', hint: 'Both sides.', status: 'verified', uploadedAt: addDays(T, -14), verifiedAt: addDays(T, -12), fileName: 'aadhaar.pdf', fileSize: 390000, fileType: 'application/pdf' },
      { id: 'd2', name: 'Rent Agreement (notarised)', hint: 'Notarised copy.', status: 'verified', uploadedAt: addDays(T, -13), verifiedAt: addDays(T, -11), fileName: 'rent_agreement.pdf', fileSize: 950000, fileType: 'application/pdf' },
      { id: 'd3', name: 'Previous electricity bill', hint: "Owner's bill.", status: 'verified', uploadedAt: addDays(T, -12), verifiedAt: addDays(T, -10), fileName: 'prev_bill.pdf', fileSize: 220000, fileType: 'application/pdf' },
      { id: 'd4', name: 'Passport-size photograph', hint: 'Recent photo.', status: 'verified', uploadedAt: addDays(T, -11), verifiedAt: addDays(T, -9), fileName: 'photo.jpg', fileSize: 150000, fileType: 'image/jpeg' },
      { id: 'd5', name: 'Security deposit (refundable)', hint: 'Demand draft in favour of BSES.', status: 'verified', uploadedAt: addDays(T, -10), verifiedAt: addDays(T, -8), fileName: 'deposit.jpg', fileSize: 180000, fileType: 'image/jpeg' },
    ],
  },

  // 4. SUBMITTED — waiting for installation confirmation
  {
    id: 'HYD-3305', createdAt: addDays(T, -20),
    customerName: 'Deepa Reddy', customerPhone: '+91 96661 30045',
    customerEmail: 'deepa.reddy@tcs.com',
    address: 'Flat 8A, Cyber Towers Residency, Hitech City, Hyderabad 500081',
    city: 'Hyderabad', moveInDate: addDays(T, 18),
    slaDeadline: addDays(T, 11), status: 'submitted', priority: 'on_track',
    submittedAt: addDays(T, -2),
    notes: ['Application submitted. Ref: TSSP-2026-88721', 'Following up with TSSPDCL for installation date.'],
    log: [
      { id: '1', ts: addDays(T, -20) + 'T09:00:00Z', actor: 'System', action: 'Case Created', detail: 'Deepa Reddy — Hyderabad' },
      { id: '2', ts: addDays(T, -10) + 'T11:00:00Z', actor: 'Ops', action: 'Status Changed', detail: '→ ready_to_submit' },
      { id: '3', ts: addDays(T, -2) + 'T14:30:00Z', actor: 'Ops', action: 'Status Changed', detail: '→ submitted: Submitted to TSSPDCL. Ref: TSSP-2026-88721' },
    ],
    utilities: [
      { id: 'u1', type: 'electricity', provider: 'TSSPDCL', slaDeadline: addDays(T, 11), status: 'scheduled', scheduledDate: addDays(T, 12) },
    ],
    documents: [
      { id: 'd1', name: 'Aadhaar Card copy', hint: 'Both sides.', status: 'verified', uploadedAt: addDays(T, -18), verifiedAt: addDays(T, -16), fileName: 'aadhaar.pdf', fileSize: 410000, fileType: 'application/pdf' },
      { id: 'd2', name: 'Rent Agreement (registered)', hint: 'Registered copy.', status: 'verified', uploadedAt: addDays(T, -17), verifiedAt: addDays(T, -15), fileName: 'rent_agreement.pdf', fileSize: 880000, fileType: 'application/pdf' },
      { id: 'd3', name: 'Previous electricity bill', hint: "Owner's bill.", status: 'verified', uploadedAt: addDays(T, -16), verifiedAt: addDays(T, -14), fileName: 'prev_bill.pdf', fileSize: 230000, fileType: 'application/pdf' },
      { id: 'd4', name: 'Passport-size photograph', hint: 'Recent photo.', status: 'verified', uploadedAt: addDays(T, -15), verifiedAt: addDays(T, -13), fileName: 'photo.jpg', fileSize: 160000, fileType: 'image/jpeg' },
    ],
  },

  // 5. CRITICAL — SLA overdue, 3 docs missing
  {
    id: 'CHN-0881', createdAt: addDays(T, -20),
    customerName: 'Arjun Krishnamurthy', customerPhone: '+91 98412 67890',
    customerEmail: 'arjun.k@wipro.com',
    address: 'Flat 502, OMR IT Corridor, Sholinganallur, Chennai 600119',
    city: 'Chennai', moveInDate: addDays(T, 5),
    slaDeadline: addDays(T, -1), status: 'collecting_docs', priority: 'critical',
    notes: ['Customer unreachable on phone. Sent WhatsApp message.'],
    log: [
      { id: '1', ts: addDays(T, -20) + 'T09:00:00Z', actor: 'System', action: 'Case Created', detail: 'Arjun Krishnamurthy — Chennai' },
      { id: '2', ts: addDays(T, -12) + 'T10:00:00Z', actor: 'Ops', action: 'Document Verified', detail: '"Aadhaar Card copy" → verified' },
      { id: '3', ts: addDays(T, -11) + 'T10:00:00Z', actor: 'Ops', action: 'Document Verified', detail: '"Rent Agreement" → verified' },
      { id: '4', ts: addDays(T, -1) + 'T08:00:00Z', actor: 'System', action: 'SLA Breached', detail: 'TANGEDCO SLA deadline passed' },
    ],
    utilities: [
      { id: 'u1', type: 'electricity', provider: 'TANGEDCO', slaDeadline: addDays(T, -1), status: 'overdue' },
    ],
    documents: [
      { id: 'd1', name: 'Aadhaar Card copy', hint: 'Both sides.', status: 'verified', uploadedAt: addDays(T, -14), verifiedAt: addDays(T, -12), fileName: 'aadhaar.pdf', fileSize: 400000, fileType: 'application/pdf' },
      { id: 'd2', name: 'Rent Agreement (registered)', hint: 'Registered copy.', status: 'verified', uploadedAt: addDays(T, -13), verifiedAt: addDays(T, -11), fileName: 'rent_agreement.pdf', fileSize: 900000, fileType: 'application/pdf' },
      { id: 'd3', name: 'Previous EB bill of property', hint: "Owner's electricity board bill.", status: 'missing' },
      { id: 'd4', name: 'Passport-size photograph', hint: 'Recent colour photo.', status: 'missing' },
      { id: 'd5', name: 'TANGEDCO application form', hint: 'Download from tangedco.gov.in.', status: 'missing' },
    ],
  },

  // 6. COMPLETED — all done
  {
    id: 'PUN-2214', createdAt: addDays(T, -25),
    customerName: 'Sneha Kulkarni', customerPhone: '+91 95527 11234',
    customerEmail: 'sneha.kulkarni@gmail.com',
    address: 'Apt 210, Hinjewadi IT Park Phase 2, Pune 411057',
    city: 'Pune', moveInDate: addDays(T, -3),
    slaDeadline: addDays(T, -10), status: 'completed', priority: 'on_track',
    submittedAt: addDays(T, -12), installationDate: addDays(T, -4),
    notes: ['Installation completed. Meter no: MS-2026-441-B'],
    log: [
      { id: '1', ts: addDays(T, -25) + 'T09:00:00Z', actor: 'System', action: 'Case Created', detail: 'Sneha Kulkarni — Pune' },
      { id: '2', ts: addDays(T, -15) + 'T10:00:00Z', actor: 'Ops', action: 'Status Changed', detail: '→ ready_to_submit' },
      { id: '3', ts: addDays(T, -12) + 'T11:00:00Z', actor: 'Ops', action: 'Status Changed', detail: '→ submitted' },
      { id: '4', ts: addDays(T, -5) + 'T09:00:00Z', actor: 'Ops', action: 'Installation Scheduled', detail: `electricity (MSEDCL) — ${addDays(T, -4)}` },
      { id: '5', ts: addDays(T, -4) + 'T16:00:00Z', actor: 'Ops', action: 'Utility Installed', detail: 'electricity (MSEDCL) — done' },
    ],
    utilities: [
      { id: 'u1', type: 'electricity', provider: 'MSEDCL', slaDeadline: addDays(T, -10), status: 'completed', scheduledDate: addDays(T, -4), installedAt: addDays(T, -4) },
    ],
    documents: [
      { id: 'd1', name: 'Aadhaar Card copy', hint: 'Both sides.', status: 'verified', uploadedAt: addDays(T, -22), verifiedAt: addDays(T, -20), fileName: 'aadhaar.pdf', fileSize: 420000, fileType: 'application/pdf' },
      { id: 'd2', name: 'Rent Agreement (registered)', hint: 'Registered copy.', status: 'verified', uploadedAt: addDays(T, -21), verifiedAt: addDays(T, -19), fileName: 'rent_agreement.pdf', fileSize: 870000, fileType: 'application/pdf' },
      { id: 'd3', name: 'Previous electricity bill', hint: "Owner's last bill.", status: 'verified', uploadedAt: addDays(T, -20), verifiedAt: addDays(T, -18), fileName: 'prev_bill.pdf', fileSize: 210000, fileType: 'application/pdf' },
      { id: 'd4', name: 'Passport-size photograph', hint: 'Recent photo.', status: 'verified', uploadedAt: addDays(T, -19), verifiedAt: addDays(T, -17), fileName: 'photo.jpg', fileSize: 155000, fileType: 'image/jpeg' },
      { id: 'd5', name: 'MSEDCL application form', hint: 'Filled and signed.', status: 'verified', uploadedAt: addDays(T, -18), verifiedAt: addDays(T, -16), fileName: 'msedcl_form.pdf', fileSize: 320000, fileType: 'application/pdf' },
    ],
  },
]
