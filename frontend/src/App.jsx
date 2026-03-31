import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Overview from './pages/Overview'
import JourneyControl from './pages/JourneyControl'
import AutomationOps from './pages/AutomationOps'
import APIHealthHub from './pages/APIHealthHub'
import AnomalyCenter from './pages/AnomalyCenter'
import Alerting from './pages/Alerting'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 bg-bg">
            <Routes>
              <Route path="/"            element={<Overview />} />
              <Route path="/journeys"    element={<JourneyControl />} />
              <Route path="/automations" element={<AutomationOps />} />
              <Route path="/api"         element={<APIHealthHub />} />
              <Route path="/anomalies"   element={<AnomalyCenter />} />
              <Route path="/alerting"    element={<Alerting />} />
              <Route path="/analytics"   element={<Analytics />} />
              <Route path="/settings"    element={<Settings />} />
              <Route path="*"            element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
