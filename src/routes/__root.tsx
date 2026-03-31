import { createRootRoute } from '@tanstack/react-router'
import { AppShell } from '@/app/layout/app-shell'

export const rootRoute = createRootRoute({ component: AppShell })
