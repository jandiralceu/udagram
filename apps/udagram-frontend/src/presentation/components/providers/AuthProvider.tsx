import { useMemo } from 'react'
import log from 'loglevel'
import type { Register } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
  const { data: user, isLoading: isGettingProfile } = useQuery({
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
    onSuccess: () => {
      router.navigate({ to: '/signin', search: { redirect: '/' } })

      log.info('✅ Signout successful')
    },
    onError(error: unknown) {
      log.error('❌ Signout failed:', error)
    },
    retry: false,
  })

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isAuthenticating: signinStatus === 'pending',
      signin: signinHandler,
      signup: signupHandler,
      signout: signOutHandler,
    }),
    [
      user,
      isAuthenticated,
      signinStatus,
      signinHandler,
      signupHandler,
      signOutHandler,
    ]
  )

  if (isGettingProfile) {
    return <div>Loading...</div>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
