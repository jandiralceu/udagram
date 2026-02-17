import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import signinSvg from '@images/signin.svg'

export const Route = createFileRoute('/(auth)')({
  validateSearch: search => ({
    redirect: search.redirect as string | undefined,
  }),
  beforeLoad: ({ context, search }) => {
    if (context?.auth?.isAuthenticated) {
      throw redirect({
        to: search.redirect || '/',
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '100dvh',
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 4, md: 10 },
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              p: { xs: 3, md: 6 },
              borderRadius: 4,
              backgroundColor: '#fff',
              boxShadow: '0 8px 32px rgba(15, 20, 25, 0.05)',
              border: '1px solid #EFF3F4',
            }}
          >
            <Outlet />
          </Box>
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              textAlign: 'center',
            }}
          >
            <Box
              component="img"
              src={signinSvg}
              alt="Authentication Illustration"
              sx={{
                width: '100%',
                maxWidth: 500,
                height: 'auto',
                filter: 'drop-shadow(0 20px 40px rgba(29, 155, 240, 0.15))',
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
