import { Activity } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'

import { QueryKeys } from '@presentation/utils/constants'
import { FeedFactory } from '@factories/index'

import Header from './-components/Menu'
import {
  CreateFeedForm,
  FeedCard,
  FeedCardSkeleton,
  EmptyFeedState,
} from './-components/feed'

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
            <Activity mode={isLoading ? 'visible' : 'hidden'}>
              {['skeleton-1', 'skeleton-2', 'skeleton-3'].map(key => (
                <FeedCardSkeleton key={key} />
              ))}
            </Activity>

            <Activity mode={!isLoading && feeds?.length ? 'visible' : 'hidden'}>
              {feeds?.map(feed => (
                <FeedCard key={feed.id} {...feed} />
              ))}
            </Activity>

            <Activity
              mode={!isLoading && feeds?.length === 0 ? 'visible' : 'hidden'}
            >
              <EmptyFeedState />
            </Activity>
          </Box>
        </Container>
      </Box>
    </>
  )
}
