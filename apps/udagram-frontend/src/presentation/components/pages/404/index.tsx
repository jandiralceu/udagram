import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from '@tanstack/react-router'

export default function NotFoundPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 3,
        textAlign: 'center',
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: '6rem',
          fontWeight: 700,
          color: 'primary.main',
          mb: 1,
        }}
      >
        404
      </Typography>

      <Typography
        variant="h4"
        sx={{
          fontWeight: 500,
          color: 'text.primary',
          mb: 2,
        }}
      >
        Page Not Found
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          mb: 4,
          maxWidth: 500,
        }}
      >
        Sorry, the page you are looking for doesn't exist or has been moved.
        Please check the URL or go back to the homepage.
      </Typography>

      <Link to="/">Go to Homepage</Link>
    </Box>
  )
}
