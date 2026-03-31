import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { QueryProvider } from '@/app/providers/query-provider'
import { AuthProvider } from '@/app/providers/auth-provider'
import { RouterProvider } from '@/app/providers/router-provider'
import '@/app/styles/globals.css'
import '@/app/styles/tokens.css'
import '@/app/styles/utilities.css'

async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <RouterProvider />
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </React.StrictMode>
  )
})
