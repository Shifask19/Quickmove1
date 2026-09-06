import { useState } from 'react'
import { useStore } from './store/store'
import type { CreatePayload } from './store/store'
import { Sidebar } from './components/Sidebar'
import { Workspace } from './components/Workspace'
import { NewCaseModal } from './components/NewCaseModal'

export function App() {
  const [state, dispatch] = useStore()
  const [showNew, setShowNew] = useState(false)
  const active = state.connections.find(c => c.id === state.activeId)!

  function handleCreate(p: CreatePayload) {
    dispatch({ type: 'CREATE', payload: p })
    setShowNew(false)
  }

  return (
    <div className="flex h-screen bg-[#F5F6FA] overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar
        connections={state.connections}
        activeId={state.activeId}
        onSelect={id => dispatch({ type: 'SELECT', id })}
        onNew={() => setShowNew(true)}
      />
      <Workspace conn={active} dispatch={dispatch} />
      {showNew && <NewCaseModal onSubmit={handleCreate} onClose={() => setShowNew(false)} />}
    </div>
  )
}
