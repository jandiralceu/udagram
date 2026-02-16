import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@presentation/utils/constants'

import { FeedFactory } from '@factories/index'
import Header from './-components/Menu'
import { CreateFeedForm, FeedCard } from './-components/feed'

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

const feedbackRepository = FeedFactory.createRepository()

function RouteComponent() {
  const { data: feeds, isLoading } = useQuery({
    queryKey: [QueryKeys.feeds],
    queryFn: () => feedbackRepository.getFeeds(),
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return (
    <>
      <Header />
      <Box
        sx={{
          display: 'flex',
          minHeight: '100dvh',
          pt: '100px',
          pb: 4,
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="sm">
          <CreateFeedForm />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 6 }}>
            {isLoading && <div>Loading...</div>}

            {feeds?.map(feed => (
              <FeedCard key={feed.id} {...feed} />
            ))}
          </Box>
        </Container>
      </Box>
    </>
  )
}
