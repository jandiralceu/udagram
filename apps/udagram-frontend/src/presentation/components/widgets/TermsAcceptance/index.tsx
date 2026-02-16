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
 * Campo reutilizável para aceite de termos, composto por um radio button,
 * texto de termos e mensagem de erro opcional.
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
          // mt: 6,
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
