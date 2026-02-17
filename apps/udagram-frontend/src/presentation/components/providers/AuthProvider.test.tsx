import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Register } from '@tanstack/react-router'
import type { IAuthRepository, IUserRepository } from '@domain/repositories'
import { useAuth } from '../../hooks/useAuth'

// Mock loglevel
vi.mock('loglevel', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('AuthProvider', () => {
  let queryClient: QueryClient
  let mockAuthRepository: IAuthRepository
  let mockUserRepository: IUserRepository
  let mockRouter: Register['router']

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
        mutations: { retry: false },
      },
    })

    mockAuthRepository = {
      signin: vi.fn(),
      signup: vi.fn(),
      signout: vi.fn(),
    } as unknown as IAuthRepository

    mockUserRepository = {
      getProfile: vi.fn().mockResolvedValue(null),
      updateAvatar: vi.fn(),
    } as unknown as IUserRepository

    mockRouter = {
      navigate: vi.fn(),
      invalidate: vi.fn(),
    } as unknown as Register['router']

    vi.clearAllMocks()
  })

  const renderWithProviders = (ui: React.ReactNode) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider
          authRepository={mockAuthRepository}
          userRepository={mockUserRepository}
          router={mockRouter}
        >
          {ui}
        </AuthProvider>
      </QueryClientProvider>
    )
  }

  const TestConsumer = () => {
    const { signin, signup, signout, user } = useAuth()
    const handleAction = (action: () => Promise<unknown>) => {
      action().catch(() => {
        /* ignore error in UI */
      })
    }
    return (
      <div>
        <div data-testid="user-name">{user?.name ?? 'No User'}</div>
        <button
          onClick={() =>
            handleAction(() =>
              signin({ email: 'test@test.com', password: 'pw' })
            )
          }
        >
          Signin
        </button>
        <button
          onClick={() =>
            handleAction(() => signup({ name: 'N', email: 'E', password: 'P' }))
          }
        >
          Signup
        </button>
        <button onClick={() => handleAction(() => signout())}>Signout</button>
      </div>
    )
  }

  it('should render loading state when checking session', async () => {
    mockUserRepository.getProfile = vi
      .fn()
      .mockReturnValue(new Promise(() => {}))

    renderWithProviders(<div>Content</div>)

    expect(screen.getByText(/Checking your session/i)).toBeDefined()
  })

  it('should render children when session check completes', async () => {
    mockUserRepository.getProfile = vi.fn().mockResolvedValue(null)

    renderWithProviders(<div>Content</div>)

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeDefined()
    })
  })

  it('should render children when user is authenticated', async () => {
    mockUserRepository.getProfile = vi
      .fn()
      .mockResolvedValue({ id: '1', name: 'John' })

    renderWithProviders(<div>Content</div>)

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeDefined()
    })
  })

  it('should handle signin success', async () => {
    mockUserRepository.getProfile = vi.fn().mockResolvedValue(null)
    ;(mockAuthRepository.signin as Mock).mockResolvedValue({ success: true })

    renderWithProviders(<TestConsumer />)

    // Wait for initial load to finish
    await waitFor(() => expect(screen.queryByText(/Checking/)).toBeNull())
    await screen.findByText('Signin')

    // Update mock for refetch
    ;(mockUserRepository.getProfile as Mock).mockResolvedValue({
      id: '1',
      name: 'John Doe',
    })

    await act(async () => {
      screen.getByText('Signin').click()
    })

    await waitFor(() => {
      expect(mockAuthRepository.signin).toHaveBeenCalled()
      expect(screen.getByTestId('user-name').textContent).toBe('John Doe')
    })
  })

  it('should handle signin error', async () => {
    const error = new Error('Login failed')
    ;(mockAuthRepository.signin as Mock).mockRejectedValue(error)

    renderWithProviders(<TestConsumer />)

    await waitFor(() => expect(screen.queryByText(/Checking/)).toBeNull())
    await screen.findByText('Signin')

    await act(async () => {
      screen.getByText('Signin').click()
    })

    await waitFor(() => {
      expect(mockAuthRepository.signin).toHaveBeenCalled()
    })
  })

  it('should handle signup success', async () => {
    ;(mockAuthRepository.signup as Mock).mockResolvedValue({ id: '1' })

    renderWithProviders(<TestConsumer />)

    await waitFor(() => expect(screen.queryByText(/Checking/)).toBeNull())
    await screen.findByText('Signup')

    await act(async () => {
      screen.getByText('Signup').click()
    })

    await waitFor(() => {
      expect(mockAuthRepository.signup).toHaveBeenCalled()
    })
  })

  it('should handle signup error', async () => {
    const error = new Error('Signup failed')
    ;(mockAuthRepository.signup as Mock).mockRejectedValue(error)

    renderWithProviders(<TestConsumer />)

    await waitFor(() => expect(screen.queryByText(/Checking/)).toBeNull())
    await screen.findByText('Signup')

    await act(async () => {
      screen.getByText('Signup').click()
    })

    await waitFor(() => {
      expect(mockAuthRepository.signup).toHaveBeenCalled()
    })
  })

  it('should handle signout success', async () => {
    ;(mockUserRepository.getProfile as Mock).mockResolvedValue({
      id: '1',
      name: 'John',
    })
    ;(mockAuthRepository.signout as Mock).mockResolvedValue(undefined)

    renderWithProviders(<TestConsumer />)

    await waitFor(() => expect(screen.queryByText(/Checking/)).toBeNull())
    await screen.findByText('John')

    // Reset mock for refetch that happens after signout (resetQueries)
    ;(mockUserRepository.getProfile as Mock).mockResolvedValue(null)

    await act(async () => {
      screen.getByText('Signout').click()
    })

    await waitFor(
      () => {
        expect(mockAuthRepository.signout).toHaveBeenCalled()
        expect(mockRouter.navigate).toHaveBeenCalledWith({
          to: '/signin',
          search: { redirect: '/' },
        })
        expect(mockRouter.invalidate).toHaveBeenCalled()
        expect(screen.getByTestId('user-name').textContent).toBe('No User')
      },
      { timeout: 2000 }
    )
  })

  it('should handle signout error', async () => {
    const error = new Error('Signout failed')
    ;(mockAuthRepository.signout as Mock).mockRejectedValue(error)

    renderWithProviders(<TestConsumer />)

    await waitFor(() => expect(screen.queryByText(/Checking/)).toBeNull())
    await screen.findByText('Signout')

    await act(async () => {
      screen.getByText('Signout').click()
    })

    await waitFor(() => {
      expect(mockAuthRepository.signout).toHaveBeenCalled()
    })
  })
})
