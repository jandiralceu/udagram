import { createTheme } from '@mui/material/styles'

/**
 * Design System Theme
 * colors and styles following the application UI
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1D9BF0', // Brand Blue
      light: '#4AB1F4',
      dark: '#1A8CD8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0F1419', // Brand Black
      light: '#272C30',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#F4212E',
      light: '#F85A65',
      dark: '#BF1A24',
    },
    warning: {
      main: '#FFD400',
      light: '#FFE04D',
      dark: '#CCA100',
    },
    info: {
      main: '#1D9BF0',
      light: '#4AB1F4',
      dark: '#1A8CD8',
    },
    success: {
      main: '#00BA7C',
      light: '#33C896',
      dark: '#009261',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F1419',
      secondary: '#536471',
      disabled: '#AAB8C2',
    },
    divider: '#EFF3F4',
    action: {
      hover: 'rgba(15, 20, 25, 0.1)',
      selected: 'rgba(15, 20, 25, 0.2)',
    },
  },
  shape: {
    borderRadius: 8,
  },
  cssVariables: true,
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2rem',
      color: '#0F1419',
    },
    h2: {
      fontWeight: 800,
      fontSize: '1.5rem',
      color: '#0F1419',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.25rem',
      color: '#0F1419',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.1rem',
      color: '#0F1419',
    },
    h5: {
      fontWeight: 700,
      fontSize: '1rem',
      color: '#0F1419',
    },
    h6: {
      fontWeight: 700,
      fontSize: '0.9rem',
      color: '#0F1419',
    },
    button: {
      fontWeight: 700,
      fontSize: '0.95rem',
      textTransform: 'none',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.85rem',
      lineHeight: 1.4,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: `radial-gradient(at 0% 0%, rgba(29, 155, 240, 0.05) 0px, transparent 50%), 
                       radial-gradient(at 100% 100%, rgba(29, 155, 240, 0.05) 0px, transparent 50%),
                       #FFFFFF`,
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // Pill shaped buttons
          padding: '8px 24px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: 'none',
            opacity: 0.9,
          },
        },
        contained: {
          fontWeight: 800,
        },
        outlined: {
          borderColor: '#CFD9DE',
          color: '#0F1419',
          '&:hover': {
            backgroundColor: 'rgba(15, 20, 25, 0.1)',
            borderColor: '#CFD9DE',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #EFF3F4',
          boxShadow: 'none',
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#F7F9F9',
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: '#1D9BF0',
            },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
              '& fieldset': {
                borderWidth: '2px',
              },
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#EFF3F4',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})
