import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-bg">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
