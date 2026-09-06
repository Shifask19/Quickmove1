export type DocStatus = 'missing' | 'uploading' | 'uploaded' | 'verified' | 'rejected'

export type ConnectionStatus =
  | 'collecting_docs'
  | 'ready_to_submit'
  | 'submitted'
  | 'scheduled'
  | 'completed'

export type Priority = 'critical' | 'warning' | 'on_track'

export interface RequiredDoc {
  id: string
  name: string
  hint: string
  status: DocStatus
  uploadedAt?: string
  verifiedAt?: string
  rejectionReason?: string
  fileName?: string
  fileSize?: number
  fileType?: string
}

export interface UtilityReq {
  id: string
  type: string
  provider: string
  slaDeadline: string
  scheduledDate?: string
  installedAt?: string
  status: 'pending' | 'scheduled' | 'completed' | 'overdue'
}

export interface LogEntry {
  id: string
  ts: string
  actor: string
  action: string
  detail: string
}

export interface ConnectionRequest {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  address: string
  city: string
  moveInDate: string
  createdAt: string
  slaDeadline: string
  status: ConnectionStatus
  priority: Priority
  utilities: UtilityReq[]
  documents: RequiredDoc[]
  submittedAt?: string
  installationDate?: string
  notes: string[]
  log: LogEntry[]
}

export type City = 'Mumbai' | 'Delhi' | 'Bangalore' | 'Hyderabad' | 'Chennai' | 'Pune'
export type UtilityType = 'electricity' | 'gas' | 'water' | 'internet'
