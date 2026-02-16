import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/')({
  beforeLoad: ({ context, location }) => {
    if (!context?.auth.isAuthenticated) {
      throw redirect({
        to: '/signin',
        search: {
          redirect: location.pathname,
        },
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(app)/"!</div>
}
