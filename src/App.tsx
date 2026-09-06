import { useAppStore } from './store/store'
import { CaseList } from './components/CaseList'
import { CaseDetail } from './components/CaseDetail'

export function App() {
  const [state, dispatch] = useAppStore()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Left sidebar */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <CaseList state={state} dispatch={dispatch} />
      </aside>

      {/* Main workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <CaseDetail state={state} dispatch={dispatch} />
      </main>
    </div>
  )
}
