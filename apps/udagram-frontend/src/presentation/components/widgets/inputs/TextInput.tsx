import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import type { SxProps, Theme } from '@mui/material/styles'
import type { TextFieldProps } from '@mui/material/TextField'
import TextField from '@mui/material/TextField'

/**
 * @fileoverview Custom TextInput Component
 * @module components/inputs/TextInput
 * @description
 * Reusable text input component built on top of MUI TextField, with
 * styling provided by the global theme.
 */

export type TextInputProps = Readonly<{
  /** Current value of the input */
  value: string
  /** Change handler that receives the new value */
  onChange: (value: string) => void
  /** Optional label rendered above the field */
  label?: string
  /** Placeholder text shown inside the field */
  placeholder?: string
  /** Error message. When present, field is styled as error */
  error?: string
  /** Helper text shown below the field when there is no error */
  helperText?: string
  /** Disable user interaction */
  disabled?: boolean
  /** Whether the field should take full width (default: true) */
  fullWidth?: boolean
  /** HTML input type (text, email, number, password, etc.) */
  type?: React.InputHTMLAttributes<HTMLInputElement>['type']
  /** Custom styles for the container FormControl */
  sx?: SxProps<Theme>
  /** Element placed before the input text */
  startAdornment?: React.ReactNode
  /** Element placed after the input text */
  endAdornment?: React.ReactNode
  /** Extra props forwarded to the underlying TextField */
  textFieldProps?: Partial<TextFieldProps>
  /** Ref to the underlying input element (useful for masks) */
  inputRef?: React.Ref<HTMLInputElement>
}>

/**
 * Custom TextInput Component
 *
 * A standardized input field that automatically applies the design system's
 * typography, spacing, and interaction states (hover, focus, error).
 */
export function TextInput({
  value,
  onChange,
  label,
  placeholder,
  error,
  helperText,
  disabled = false,
  fullWidth = true,
  type = 'text',
  sx,
  startAdornment,
  endAdornment,
  textFieldProps,
  inputRef,
}: TextInputProps) {
  const showError = Boolean(error)
  const helper = error || helperText

  return (
    <FormControl fullWidth={fullWidth} error={showError} sx={sx}>
      {label && (
        <InputLabel
          shrink
          sx={{
            position: 'static',
            transform: 'none',
            mb: 0.5,
          }}
        >
          {label}
        </InputLabel>
      )}
      <TextField
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        error={showError}
        type={type}
        fullWidth={fullWidth}
        inputRef={inputRef}
        slotProps={{
          input: {
            startAdornment,
            endAdornment,
            sx: {
              height: 48,
              fontSize: '16px',
            },
          },
        }}
        {...textFieldProps}
      />
      {helper && <FormHelperText error={showError}>{helper}</FormHelperText>}
    </FormControl>
  )
}
