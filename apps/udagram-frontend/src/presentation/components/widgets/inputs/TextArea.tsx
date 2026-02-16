import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import type { SxProps, Theme } from '@mui/material/styles'
import type { TextFieldProps } from '@mui/material/TextField'
import TextField from '@mui/material/TextField'

/**
 * @fileoverview Custom TextArea Component
 * @module components/inputs/TextArea
 * @description
 * Reusable textarea component built on top of MUI TextField, with
 * styling provided by the global theme.
 */

export type TextAreaProps = Readonly<{
  /** Current value of the textarea */
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
  /** Number of rows to display (default: 4) */
  rows?: number
  /** Minimum number of rows (for auto-resize) */
  minRows?: number
  /** Maximum number of rows (for auto-resize) */
  maxRows?: number
  /** Custom styles for the container FormControl */
  sx?: SxProps<Theme>
  /** Extra props forwarded to the underlying TextField */
  textFieldProps?: Partial<TextFieldProps>
}>

/**
 * Custom TextArea Component
 *
 * A multi-line version of the standardized input field, supporting
 * auto-resize and consistent design system styling.
 */
export function TextArea({
  value,
  onChange,
  label,
  placeholder,
  error,
  helperText,
  disabled = false,
  fullWidth = true,
  rows = 4,
  minRows,
  maxRows,
  sx,
  textFieldProps,
}: TextAreaProps) {
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
        fullWidth={fullWidth}
        multiline
        rows={rows}
        minRows={minRows}
        maxRows={maxRows}
        slotProps={{
          input: {
            sx: {
              fontSize: '16px',
              py: 1.5,
            },
          },
        }}
        {...textFieldProps}
      />
      {helper && <FormHelperText error={showError}>{helper}</FormHelperText>}
    </FormControl>
  )
}
