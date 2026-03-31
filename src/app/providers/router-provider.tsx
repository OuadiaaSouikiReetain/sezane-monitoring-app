import { RouterProvider as TanStackRouterProvider } from '@tanstack/react-router'
import { router } from '@/app/router'

export function RouterProvider() {
  return <TanStackRouterProvider router={router} />
}
