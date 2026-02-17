import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Logo } from './index'

// Mock Link from @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

describe('Logo Component', () => {
  it('should render the Udagram text', () => {
    render(<Logo />)
    expect(screen.getByText(/Udagram/i)).toBeDefined()
  })

  it('should contain a link to home', () => {
    render(<Logo />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/')
  })
})
