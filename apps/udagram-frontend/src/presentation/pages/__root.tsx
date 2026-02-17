import { Toaster } from 'sonner'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'

import type { AuthState } from '../hooks/useAuth'

interface CustomRouterContext {
  auth: AuthState
}

const RootComponent = () => {
  return (
    <>
      <Outlet />
      <Toaster
        visibleToasts={3}
        expand
        position="top-center"
        icons={{
          success: <CheckCircleOutlinedIcon sx={{ fontSize: 24 }} />,
          error: <ErrorOutlineIcon sx={{ fontSize: 24 }} />,
          warning: <ReportProblemOutlinedIcon sx={{ fontSize: 24 }} />,
          info: <InfoOutlinedIcon sx={{ fontSize: 24 }} />,
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
