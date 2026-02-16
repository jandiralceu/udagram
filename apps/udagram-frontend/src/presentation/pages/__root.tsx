import { Toaster } from 'sonner'
import type { AuthState } from '../hooks/useAuth'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface CustomRouterContext {
  auth: AuthState
}

const RootComponent = () => {
  //   const { mode } = useTheme()

  return (
    <>
      <Outlet />
      <Toaster
        // theme={mode as 'light' | 'dark' | 'system'}
        visibleToasts={3}
        expand
        position="top-center"
        icons={{
          success: <CheckCircleIcon style={{ width: 32, height: 32 }} />,
          error: <XCircleIcon style={{ width: 32, height: 32 }} />,
          warning: <ExclamationCircleIcon style={{ width: 32, height: 32 }} />,
          info: <InformationCircleIcon style={{ width: 32, height: 32 }} />,
        }}
        toastOptions={{
          classNames: {
            success: 'toast-success',
            error: 'toast-error',
            warning: 'toast-warning',
            info: 'toast-info',
          },
        }}
      />
      <TanStackRouterDevtools />
    </>
  )
}

export const Route = createRootRouteWithContext<CustomRouterContext>()({
  component: RootComponent,
})
