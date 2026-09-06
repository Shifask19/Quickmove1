export type UtilityType = 'electricity' | 'gas' | 'water' | 'internet' | 'waste'

export type DocumentStatus = 'missing' | 'uploaded' | 'verified' | 'rejected'

export type CasePriority = 'critical' | 'warning' | 'on_track'

export type ExceptionType =
  | 'missing_documents'
  | 'overdue_request'
  | 'install_after_movein'
  | 'date_changed'
  | 'duplicate_request'

export interface Document {
  id: string
  name: string
  utility: UtilityType
  status: DocumentStatus
  uploadedAt?: string
  verifiedAt?: string
  rejectionReason?: string
  required: boolean
}

export interface UtilityRequest {
  id: string
  type: UtilityType
  provider: string
  requestedAt: string
  scheduledDate?: string
  installedDate?: string
  slaDeadline: string
  status: 'pending' | 'scheduled' | 'completed' | 'overdue' | 'cancelled'
}

export interface Exception {
  id: string
  type: ExceptionType
  severity: 'critical' | 'warning'
  message: string
  utilityId?: string
  detectedAt: string
  resolved: boolean
}

export interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  details: string
}

export interface AIInsight {
  currentProblem: string
  biggestRisk: string
  nextAction: string
  customerMessage: string
  vendorMessage: string
}

export type City = 'Mumbai' | 'Delhi' | 'Bangalore' | 'Hyderabad' | 'Chennai' | 'Pune'

export interface Case {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  city: City
  fromAddress: string
  toAddress: string
  moveInDate: string
  createdAt: string
  utilities: UtilityType[]
  documents: Document[]
  utilityRequests: UtilityRequest[]
  exceptions: Exception[]
  auditLog: AuditEntry[]
  priority: CasePriority
  aiInsight: AIInsight
  status: 'active' | 'completed' | 'on_hold'
}
