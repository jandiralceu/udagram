/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useAuth, AuthContext, type AuthState } from './useAuth'
import React from 'react'

describe('useAuth', () => {
  it('should throw an error when used outside of AuthProvider', () => {
    // Prevent vitest from printing the error to the console during this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    )

    consoleSpy.mockRestore()
  })

  it('should return context value when used within AuthProvider', () => {
    const mockValue: AuthState = {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
      },
      isAuthenticated: true,
      isAuthenticating: false,
      signin: vi.fn(),
      signup: vi.fn(),
      signout: vi.fn(),
    }

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current).toEqual(mockValue)
  })
})
