import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Avatar from '@mui/material/Avatar'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '@presentation/hooks/useAuth'
import { ProfileModal } from '../ProfileModal'

export default function Header() {
  const { signout, user } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={() => setProfileOpen(true)}
                sx={{ p: 0.5 }}
                title="My Profile"
              >
                <Avatar
                  src={user?.avatar}
                  sx={{
                    width: 32,
                    height: 32,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              </IconButton>

              <IconButton
                onClick={() => signout()}
                color="inherit"
                title="Sign out"
                sx={{
                  '&:hover': {
                    bgcolor: 'rgba(244, 33, 46, 0.1)',
                    color: 'error.main',
                  },
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
