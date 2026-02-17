import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { TextInput } from '.'

describe('TextInput', () => {
  it('renders correctly with default props', () => {
    const handleChange = vi.fn()
    render(<TextInput value="" onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).not.toBeDisabled()
  })

  it('renders with label and placeholder', () => {
    const handleChange = vi.fn()
    render(
      <TextInput
        value=""
        onChange={handleChange}
        label="Test Label"
        placeholder="Test Placeholder"
      />
    )

    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Test Placeholder')).toBeInTheDocument()
  })

  it('calls onChange when typing', () => {
    const handleChange = vi.fn()
    render(<TextInput value="" onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'New Value' } })

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith('New Value')
  })

  it('displays error state correctly', () => {
    const handleChange = vi.fn()
    render(<TextInput value="" onChange={handleChange} error="Error Message" />)

    const input = screen.getByRole('textbox')
    expect(input).toBeInvalid()
    expect(screen.getByText('Error Message')).toBeInTheDocument()
  })

  it('displays helper text when no error', () => {
    const handleChange = vi.fn()
    render(
      <TextInput value="" onChange={handleChange} helperText="Helper Text" />
    )

    expect(screen.getByText('Helper Text')).toBeInTheDocument()
  })

  it('renders in disabled state', () => {
    const handleChange = vi.fn()
    render(<TextInput value="Disabled" onChange={handleChange} disabled />)

    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })
})
