import Typography from '@mui/material/Typography'
import { Link } from '@tanstack/react-router'

export function Logo() {
  return (
    <Typography
      variant="h1"
      component={Link}
      to="/"
      sx={{
        fontWeight: 900,
        color: 'primary.main',
        textDecoration: 'none',
        letterSpacing: '-1px',
        userSelect: 'none',
        fontSize: '1.5rem',
        '&:hover': {
          color: 'primary.main',
        },
      }}
    >
      Udagram
    </Typography>
  )
}
