import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { TermsAcceptanceField } from './TermsAcceptanceField'

describe('TermsAcceptanceField', () => {
  it('should render correctly with label', () => {
    const handleChange = vi.fn()
    render(
      <TermsAcceptanceField
        checked={false}
        onChange={handleChange}
        label="Accept Terms"
      />
    )

    expect(screen.getByLabelText('Accept Terms')).toBeInTheDocument()
    expect(screen.getByRole('radio')).toBeInTheDocument()
  })

  it('should call onChange when clicked', () => {
    const handleChange = vi.fn()
    render(
      <TermsAcceptanceField
        checked={false}
        onChange={handleChange}
        label="Accept Terms"
      />
    )

    const radio = screen.getByRole('radio')
    fireEvent.click(radio)

    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('should display error message', () => {
    const handleChange = vi.fn()
    render(
      <TermsAcceptanceField
        checked={false}
        onChange={handleChange}
        label="Accept Terms"
        error="You must accept"
      />
    )

    expect(screen.getByText('You must accept')).toBeInTheDocument()
  })

  it('should render in disabled state', () => {
    const handleChange = vi.fn()
    render(
      <TermsAcceptanceField
        checked={false}
        onChange={handleChange}
        label="Accept Terms"
        disabled
      />
    )

    expect(screen.getByRole('radio')).toBeDisabled()
  })
})
