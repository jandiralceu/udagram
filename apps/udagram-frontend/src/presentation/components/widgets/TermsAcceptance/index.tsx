import Radio from '@mui/material/Radio'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'

export type TermsAcceptanceProps = Readonly<{
  checked: boolean
  onChange: (checked: boolean) => void
  label: React.ReactNode
  error?: string
  disabled?: boolean
}>

/**
 * TermsAcceptanceField
 *
 * Reusable field for terms acceptance, composed of a radio button,
 * terms text and an optional error message.
 */
export function TermsAcceptance({
  checked,
  onChange,
  label,
  error,
  disabled = false,
}: TermsAcceptanceProps) {
  const showError = Boolean(error)

  return (
    <Box>
      <FormControlLabel
        control={
          <Radio
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            disabled={disabled}
          />
        }
        label={label}
        sx={{
          '& .MuiFormControlLabel-label': {
            fontSize: '0.8rem',
          },
        }}
      />
      {showError && (
        <FormHelperText error sx={{ ml: 2 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  )
}
