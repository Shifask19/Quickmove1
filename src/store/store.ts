import { useReducer } from 'react'
import type { Case, City, UtilityType, DocumentStatus } from '../types'
import { DEMO_CASES } from '../data/demoCases'
import {
  uid, today, generateDocuments, generateUtilityRequests,
  refreshCase, auditEntry, updateDocStatus
} from '../engine/caseEngine'

export interface AppState {
  cases: Case[]
  selectedCaseId: string | null
  view: 'list' | 'detail'
  aiPanelOpen: boolean
}

export type Action =
  | { type: 'SELECT_CASE'; id: string }
  | { type: 'BACK_TO_LIST' }
  | { type: 'TOGGLE_AI_PANEL' }
  | { type: 'CREATE_CASE'; payload: CreateCasePayload }
  | { type: 'UPDATE_DOC_STATUS'; caseId: string; docId: string; status: DocumentStatus; rejectionReason?: string }
  | { type: 'SET_SCHEDULED_DATE'; caseId: string; reqId: string; date: string }
  | { type: 'MARK_INSTALLED'; caseId: string; reqId: string }
  | { type: 'ADD_AUDIT'; caseId: string; actor: string; action: string; details: string }

export interface CreateCasePayload {
  customerName: string
  customerPhone: string
  customerEmail: string
  city: City
  fromAddress: string
  toAddress: string
  moveInDate: string
  utilities: UtilityType[]
}

function updateCase(cases: Case[], id: string, updater: (c: Case) => Case): Case[] {
  return cases.map(c => c.id === id ? updater(c) : c)
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SELECT_CASE':
      return { ...state, selectedCaseId: action.id, view: 'detail', aiPanelOpen: false }

    case 'BACK_TO_LIST':
      return { ...state, view: 'list', selectedCaseId: null, aiPanelOpen: false }

    case 'TOGGLE_AI_PANEL':
      return { ...state, aiPanelOpen: !state.aiPanelOpen }

    case 'CREATE_CASE': {
      const p = action.payload
      const id = uid()
      const documents = generateDocuments(p.city, p.utilities)
      const utilityRequests = generateUtilityRequests(p.city, p.utilities, p.moveInDate)
      const base: Case = {
        id,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        customerEmail: p.customerEmail,
        city: p.city,
        fromAddress: p.fromAddress,
        toAddress: p.toAddress,
        moveInDate: p.moveInDate,
        createdAt: today(),
        utilities: p.utilities,
        documents,
        utilityRequests,
        exceptions: [],
        auditLog: [
          auditEntry('Ops Agent', 'Case Created', `New relocation case created for ${p.customerName} moving to ${p.city} on ${p.moveInDate}`),
        ],
        priority: 'on_track',
        aiInsight: { currentProblem: '', biggestRisk: '', nextAction: '', customerMessage: '', vendorMessage: '' },
        status: 'active',
      }
      const fresh = refreshCase(base)
      return { ...state, cases: [fresh, ...state.cases], selectedCaseId: fresh.id, view: 'detail' }
    }

    case 'UPDATE_DOC_STATUS': {
      const cases = updateCase(state.cases, action.caseId, c => {
        const doc = c.documents.find(d => d.id === action.docId)
        const updated = updateDocStatus(c, action.docId, action.status, action.rejectionReason)
        const log = auditEntry(
          'Ops Agent',
          `Document ${action.status.charAt(0).toUpperCase() + action.status.slice(1)}`,
          `"${doc?.name}" marked as ${action.status}${action.rejectionReason ? ': ' + action.rejectionReason : ''}`
        )
        return { ...updated, auditLog: [...updated.auditLog, log] }
      })
      return { ...state, cases }
    }

    case 'SET_SCHEDULED_DATE': {
      const cases = updateCase(state.cases, action.caseId, c => {
        const utilityRequests = c.utilityRequests.map(r =>
          r.id === action.reqId
            ? { ...r, scheduledDate: action.date, status: 'scheduled' as const }
            : r
        )
        const req = c.utilityRequests.find(r => r.id === action.reqId)
        const updated = refreshCase({ ...c, utilityRequests })
        const log = auditEntry(
          'Ops Agent',
          'Installation Scheduled',
          `${req?.type} installation scheduled for ${action.date} with ${req?.provider}`
        )
        return { ...updated, auditLog: [...updated.auditLog, log] }
      })
      return { ...state, cases }
    }

    case 'MARK_INSTALLED': {
      const cases = updateCase(state.cases, action.caseId, c => {
        const utilityRequests = c.utilityRequests.map(r =>
          r.id === action.reqId
            ? { ...r, installedDate: today(), status: 'completed' as const }
            : r
        )
        const req = c.utilityRequests.find(r => r.id === action.reqId)
        const updated = refreshCase({ ...c, utilityRequests })
        const log = auditEntry(
          'Ops Agent',
          'Utility Installed',
          `${req?.type} installation completed by ${req?.provider}`
        )
        return { ...updated, auditLog: [...updated.auditLog, log] }
      })
      return { ...state, cases }
    }

    case 'ADD_AUDIT': {
      const cases = updateCase(state.cases, action.caseId, c => ({
        ...c,
        auditLog: [...c.auditLog, auditEntry(action.actor, action.action, action.details)]
      }))
      return { ...state, cases }
    }

    default:
      return state
  }
}

const initialState: AppState = {
  cases: DEMO_CASES,
  selectedCaseId: null,
  view: 'list',
  aiPanelOpen: false,
}

export function useAppStore() {
  return useReducer(reducer, initialState)
}
