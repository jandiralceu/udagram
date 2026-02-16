import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TextArea } from './TextArea'

describe('TextArea', () => {
  it('renders correctly with default props', () => {
    const handleChange = vi.fn()
    render(<TextArea value="" onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    // MUI TextField multiline renders a textarea inside a div possibly or just textarea
    // Depending on version, but role 'textbox' usually matches.
  })

  it('renders with label and placeholder', () => {
    const handleChange = vi.fn()
    render(
      <TextArea
        value=""
        onChange={handleChange}
        label="Area Label"
        placeholder="Area Placeholder"
      />
    )

    expect(screen.getByText('Area Label')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Area Placeholder')).toBeInTheDocument()
  })

  it('calls onChange when typing', () => {
    const handleChange = vi.fn()
    render(<TextArea value="" onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Line 1\nLine 2' } })

    expect(handleChange).toHaveBeenCalledWith('Line 1\nLine 2')
  })

  it('displays error message', () => {
    const handleChange = vi.fn()
    render(<TextArea value="" onChange={handleChange} error="Error Area" />)

    const input = screen.getByRole('textbox')
    expect(input).toBeInvalid()
    expect(screen.getByText('Error Area')).toBeInTheDocument()
  })

  it('respects minRows/maxRows props (smoke test)', () => {
    // Visual prop check is hard in jsdom, but we can check if it renders without crashing
    const handleChange = vi.fn()
    render(
      <TextArea
        value="Content"
        onChange={handleChange}
        minRows={3}
        maxRows={6}
      />
    )
    expect(screen.getByRole('textbox')).toHaveValue('Content')
  })
})
