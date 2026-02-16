import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import { theme } from '@presentation/theme'

interface AppThemeProviderProps {
  children: React.ReactNode
}

export function AppThemeProvider({
  children,
}: Readonly<AppThemeProviderProps>) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
