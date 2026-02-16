import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Container from '@mui/material/Container'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '@presentation/hooks/useAuth'

export function Header() {
  const { signout } = useAuth()

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: theme => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="sm">
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            px: '0 !important',
            minHeight: '64px',
          }}
        >
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 900,
              color: 'primary.main',
              letterSpacing: '-1px',
              userSelect: 'none',
            }}
          >
            Udagram
          </Typography>

          <IconButton
            onClick={() => signout()}
            color="inherit"
            title="Sair"
            sx={{
              '&:hover': {
                bgcolor: 'rgba(244, 33, 46, 0.1)',
                color: 'error.main',
              },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
