import { createRoute } from '@tanstack/react-router'
import { automationsRoute } from './index'
import { AutomationDetailPage } from '@/features/automations/components/automation-detail-page'

export const automationDetailRoute = createRoute({
  getParentRoute: () => automationsRoute,
  path: '$automationId',
  component: AutomationDetailPage,
})
