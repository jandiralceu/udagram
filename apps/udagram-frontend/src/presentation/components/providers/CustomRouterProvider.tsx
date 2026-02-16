import { RouterProvider } from '@tanstack/react-router'
import type { Register } from '@tanstack/react-router'

import { useAuth } from '../../hooks/useAuth'

export function CustomRouterProvider({
  router,
}: {
  readonly router: Register['router']
}) {
  const auth = useAuth()

  return <RouterProvider router={router} context={{ auth }} />
}
