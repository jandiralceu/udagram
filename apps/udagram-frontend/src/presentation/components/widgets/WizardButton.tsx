import { ArrowLongRightIcon } from '@heroicons/react/24/outline'
import Button, { type ButtonProps } from '@mui/material/Button'

type WizardButtonVariant = 'next' | 'submit'

/**
 * Props for WizardButton
 *
 * Configuration options for the WizardButton component.
 * It extends Material UI's ButtonProps, excluding 'variant' as it is handled internally.
 */
type Props = {
  /**
   * The variation of the button to render.
   * - `next`: (Default) Renders a button with an arrow icon, typically used to proceed to the next step.
   * - `submit`: Renders a button without an icon, typically used for the final form submission.
   */
  variant?: WizardButtonVariant
  /**
   * Optional custom text label for the button.
   * If not provided, defaults to 'Next' or 'Submit' based on the variant.
   */
  label?: string
} & Omit<ButtonProps, 'variant'>

/**
 * WizardButton Component
 *
 * A specialized button component designed for multi-step wizard forms.
 * It encapsulates the styling and iconography (using Heroicons) for common wizard actions
 * to ensure consistency across the application.
 *
 * @example
 * ```tsx
 * // Default usage (renders "Next" with value arrow icon)
 * <WizardButton onClick={handleNext} />
 *
 * // Submit variation (renders "Submit")
 * <WizardButton variant="submit" type="submit" />
 *
 * // Custom label
 * <WizardButton variant="next" label="Continue" />
 * ```
 */
export const WizardButton = ({
  variant = 'next',
  label,
  children,
  sx,
  ...rest
}: Props) => {
  // Default labels for each variant
  const defaultLabels: Record<WizardButtonVariant, string> = {
    next: 'Next',
    submit: 'Submit',
  }

  // Default icons for each variant (Material-UI icons)
  const defaultIcons: Record<WizardButtonVariant, React.ReactNode> = {
    next: (
      <ArrowLongRightIcon
        style={{ marginLeft: 1 }}
        data-testid="wizard-next-icon"
      />
    ),
    submit: null,
  }

  // Determine button variant (MUI)
  const muiVariant: ButtonProps['variant'] = 'contained'

  // Get label and icon (icon is always internal)
  const buttonLabel = label || defaultLabels[variant]
  const buttonIcon = defaultIcons[variant]

  // Base styles
  const baseStyles = {
    minWidth: 120,
    borderRadius: 8,
    height: 40,
    textTransform: 'none' as const,
    transition: 'all 0.3s ease-in-out',
  }

  return (
    <Button
      variant={muiVariant}
      color="primary"
      disableElevation
      sx={{
        ...baseStyles,
        bgcolor: 'primary.main',
        color: 'background.default',
        '&:hover': {
          bgcolor: 'primary.dark',
          color: 'background.default',
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      {...rest}
    >
      {children || buttonLabel}
      {buttonIcon}
    </Button>
  )
}
