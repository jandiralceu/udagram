import { useMemo } from 'react'
import log from 'loglevel'
import type { Register } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, CircularProgress, Typography } from '@mui/material'

import type { signinRequest, signupRequest } from '@domain/entities'
import type { IAuthRepository, IUserRepository } from '@domain/repositories'

import { AuthContext } from '../../hooks/useAuth'
import { QueryKeys } from '../../utils/constants'

type Props = Readonly<{
  children: React.ReactNode
  authRepository: IAuthRepository
  userRepository: IUserRepository
  router: Register['router']
}>

export function AuthProvider({
  children,
  authRepository,
  userRepository,
  router,
}: Props) {
  const queryClient = useQueryClient()
  const {
    data: user,
    isLoading: isGettingProfile,
    isRefetching: isRefetchingProfile,
  } = useQuery({
    queryKey: [QueryKeys.me],
    queryFn: () => userRepository.getProfile(),
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: true,
  })

  const isAuthenticated = !!user

  const { mutateAsync: signinHandler, status: signinStatus } = useMutation({
    mutationFn: async (data: signinRequest) => {
      return await authRepository.signin(data)
    },
    onSuccess: async data => {
      await queryClient.refetchQueries({ queryKey: [QueryKeys.me] })
      log.info('✅ Signin successful', data)
    },
    onError(error: unknown) {
      log.error('❌ Login failed:', error)
    },
    retry: false,
  })

  const { mutateAsync: signupHandler } = useMutation({
    mutationFn: async (data: signupRequest) => {
      return await authRepository.signup(data)
    },
    onSuccess: data => {
      log.info('✅ Signup successful', data)
    },
    onError(error: unknown) {
      log.error('❌ Signup failed:', error)
    },
    retry: false,
  })

  const { mutateAsync: signOutHandler } = useMutation({
    mutationFn: async () => {
      return await authRepository.signout()
    },
    onSuccess: async () => {
      // Clear user data from cache and reset authentication state
      queryClient.setQueryData([QueryKeys.me], null)
      await queryClient.resetQueries({ queryKey: [QueryKeys.me] })

      // Navigate to signin page
      await router.navigate({ to: '/signin', search: { redirect: '/' } })

      // Force router to re-evaluate guards
      await router.invalidate()

      log.info('✅ Signout successful')
    },
    onError(error: unknown) {
      log.error('❌ Signout failed:', error)
    },
    retry: false,
  })

  const { mutateAsync: updateAvatarHandler } = useMutation({
    mutationFn: async (file: File) => {
      return await userRepository.updateAvatar(file)
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: [QueryKeys.me] })
      log.info('✅ Avatar updated successfully')
    },
    onError(error: unknown) {
      log.error('❌ Avatar update failed:', error)
    },
    retry: false,
  })

  const isAuthenticating = signinStatus === 'pending'

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isAuthenticating,
      signin: signinHandler,
      signup: signupHandler,
      signout: signOutHandler,
      updateAvatar: updateAvatarHandler,
    }),
    [
      user,
      isAuthenticated,
      isAuthenticating,
      signinHandler,
      signupHandler,
      signOutHandler,
      updateAvatarHandler,
    ]
  )

  const loadingMessage = useMemo(() => {
    if (signinStatus != 'idle') return null
    if ((isGettingProfile && !user) || isRefetchingProfile) {
      return 'Checking your session...'
    }

    return null
  }, [signinStatus, isGettingProfile, user, isRefetchingProfile])

  if (loadingMessage) {
    return <AuthLoadingOverlay message={loadingMessage} />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Isolated loading overlay for the authentication process.
 */
function AuthLoadingOverlay({ message }: { readonly message: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        gap: 2,
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress
        size={40}
        thickness={4}
        sx={{ color: 'primary.main' }}
      />
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          animation: 'pulse 2s infinite ease-in-out',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 },
          },
        }}
      >
        {message}
      </Typography>
    </Box>
  )
}
