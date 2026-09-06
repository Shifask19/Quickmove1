import { useReducer } from 'react'
import type { ConnectionRequest, RequiredDoc, ConnectionStatus, City, UtilityType } from '../types'
import { CONNECTIONS } from '../data/connections'
import { uid, todayStr, logEntry, slaDeadline, computePriority } from '../engine/logic'
import { PROVIDERS } from '../engine/providers'

export interface AppState {
  connections: ConnectionRequest[]
  activeId: string
  view: 'list' | 'detail'
}

export interface CreatePayload {
  customerName: string
  customerPhone: string
  customerEmail: string
  address: string
  city: City
  moveInDate: string
  utilities: UtilityType[]
}

export type Action =
  | { type: 'SELECT'; id: string }
  | { type: 'BACK' }
  | { type: 'CREATE'; payload: CreatePayload }
  | { type: 'UPDATE_DOC'; connId: string; docId: string; patch: Partial<RequiredDoc> }
  | { type: 'SET_CONN_STATUS'; connId: string; status: ConnectionStatus; note?: string }
  | { type: 'SCHEDULE_UTIL'; connId: string; utilId: string; date: string }
  | { type: 'COMPLETE_UTIL'; connId: string; utilId: string }
  | { type: 'ADD_NOTE'; connId: string; note: string }

function recomputeStatus(conn: ConnectionRequest): ConnectionStatus {
  if (['submitted', 'scheduled', 'completed'].includes(conn.status)) return conn.status
  const allVerified = conn.documents.every(d => d.status === 'verified')
  return allVerified ? 'ready_to_submit' : 'collecting_docs'
}

function refresh(conn: ConnectionRequest): ConnectionRequest {
  const today = todayStr()
  const utilities = conn.utilities.map(u => ({
    ...u,
    status: u.status === 'completed' ? 'completed' as const
      : u.slaDeadline < today ? 'overdue' as const
      : u.status,
  }))
  const updated = { ...conn, utilities, status: recomputeStatus({ ...conn, utilities }) }
  return { ...updated, priority: computePriority(updated) }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {

    case 'SELECT':
      return { ...state, activeId: action.id, view: 'detail' }

    case 'BACK':
      return { ...state, view: 'list' }

    case 'CREATE': {
      const p = action.payload
      const id = `QM-${Math.floor(Math.random() * 9000 + 1000)}`
      const docs: RequiredDoc[] = []
      const utilities = p.utilities.map(ut => {
        const prov = PROVIDERS[p.city]?.[ut]
        if (!prov) return null
        // Add docs for this utility (deduplicate by name)
        const existingNames = new Set(docs.map(d => d.name))
        prov.docs.forEach(d => {
          if (!existingNames.has(d.name)) {
            docs.push({ id: uid(), name: d.name, hint: d.hint, status: 'missing' })
            existingNames.add(d.name)
          }
        })
        const deadline = slaDeadline(p.moveInDate, prov.slaDays)
        return {
          id: uid(),
          type: ut,
          provider: prov.name,
          slaDeadline: deadline,
          status: deadline < todayStr() ? 'overdue' as const : 'pending' as const,
        }
      }).filter(Boolean) as ConnectionRequest['utilities']

      // pick tightest sla as the connection sla
      const sla = utilities.reduce((min, u) => u.slaDeadline < min ? u.slaDeadline : min,
        utilities[0]?.slaDeadline ?? p.moveInDate)

      const base: ConnectionRequest = {
        id, customerName: p.customerName, customerPhone: p.customerPhone,
        customerEmail: p.customerEmail, address: p.address,
        city: p.city, moveInDate: p.moveInDate,
        createdAt: todayStr(), slaDeadline: sla,
        status: 'collecting_docs', priority: 'warning',
        utilities, documents: docs, notes: [],
        log: [logEntry('Ops', 'Case Created', `${p.customerName} — ${p.city} — utilities: ${p.utilities.join(', ')}`)],
      }
      const fresh = refresh(base)
      return { ...state, connections: [fresh, ...state.connections], activeId: fresh.id, view: 'detail' }
    }

    case 'UPDATE_DOC': {
      const connections = state.connections.map(conn => {
        if (conn.id !== action.connId) return conn
        const documents = conn.documents.map(d =>
          d.id === action.docId ? { ...d, ...action.patch } : d
        )
        const entry = logEntry('Ops',
          action.patch.status === 'verified' ? 'Document Verified'
          : action.patch.status === 'rejected' ? 'Document Rejected'
          : action.patch.status === 'uploaded' ? 'Document Uploaded'
          : 'Document Updated',
          `"${conn.documents.find(d => d.id === action.docId)?.name}" → ${action.patch.status ?? ''}${action.patch.rejectionReason ? ': ' + action.patch.rejectionReason : ''}`,
        )
        return refresh({ ...conn, documents, log: [...conn.log, entry] })
      })
      return { ...state, connections }
    }

    case 'SET_CONN_STATUS': {
      const connections = state.connections.map(conn => {
        if (conn.id !== action.connId) return conn
        const entry = logEntry('Ops', 'Status Changed', `→ ${action.status}${action.note ? ': ' + action.note : ''}`)
        const updated = { ...conn, status: action.status,
          submittedAt: action.status === 'submitted' ? todayStr() : conn.submittedAt,
          log: [...conn.log, entry],
        }
        return refresh(updated)
      })
      return { ...state, connections }
    }

    case 'SCHEDULE_UTIL': {
      const connections = state.connections.map(conn => {
        if (conn.id !== action.connId) return conn
        const utilities = conn.utilities.map(u =>
          u.id === action.utilId ? { ...u, scheduledDate: action.date, status: 'scheduled' as const } : u
        )
        const u = conn.utilities.find(x => x.id === action.utilId)
        const entry = logEntry('Ops', 'Installation Scheduled',
          `${u?.type} (${u?.provider}) — ${action.date}`)
        return refresh({ ...conn, utilities, log: [...conn.log, entry] })
      })
      return { ...state, connections }
    }

    case 'COMPLETE_UTIL': {
      const connections = state.connections.map(conn => {
        if (conn.id !== action.connId) return conn
        const utilities = conn.utilities.map(u =>
          u.id === action.utilId ? { ...u, installedAt: todayStr(), status: 'completed' as const } : u
        )
        const u = conn.utilities.find(x => x.id === action.utilId)
        const allDone = utilities.every(x => x.status === 'completed')
        const entry = logEntry('Ops', 'Utility Installed', `${u?.type} (${u?.provider}) — done`)
        return refresh({ ...conn, utilities, status: allDone ? 'completed' : conn.status, log: [...conn.log, entry] })
      })
      return { ...state, connections }
    }

    case 'ADD_NOTE': {
      const connections = state.connections.map(conn =>
        conn.id === action.connId
          ? { ...conn, notes: [...conn.notes, action.note], log: [...conn.log, logEntry('Ops', 'Note Added', action.note)] }
          : conn
      )
      return { ...state, connections }
    }

    default: return state
  }
}

export function useStore() {
  return useReducer(reducer, {
    connections: CONNECTIONS,
    activeId: CONNECTIONS[0].id,
    view: 'detail' as const,
  })
}

export const CONN_STATUS_LABEL: Record<ConnectionStatus, string> = {
  collecting_docs: 'Collecting Documents',
  ready_to_submit: 'Ready to Submit',
  submitted:       'Submitted to Provider',
  scheduled:       'Installation Scheduled',
  completed:       'Connection Complete',
}
