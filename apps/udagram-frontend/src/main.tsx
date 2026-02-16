import { StrictMode } from 'react'
import log from 'loglevel'
import ReactDOM from 'react-dom/client'
import { createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthFactory, UserFactory } from '@factories/index'
import NotFoundPage from '@presentation/components/pages/404'
import { AuthProvider } from '@presentation/components/providers/AuthProvider.tsx'
import { CustomRouterProvider } from '@presentation/components/providers/CustomRouterProvider.tsx'

import { routeTree } from './routeTree.gen'
import './index.css'
import { AppThemeProvider } from '@presentation/components/providers/AppThemeProvider'

log.setLevel(import.meta.env.DEV ? 'debug' : 'warn')

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
  defaultNotFoundComponent: NotFoundPage,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
const authRepository = AuthFactory.createRepository()
const userRepository = UserFactory.createRepository()

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)

  root.render(
    <StrictMode>
      <AppThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider
            router={router}
            authRepository={authRepository}
            userRepository={userRepository}
          >
            <CustomRouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </AppThemeProvider>
    </StrictMode>
  )
}
