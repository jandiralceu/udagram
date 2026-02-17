import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import LogoutIcon from '@mui/icons-material/Logout'

import { ProfileModal } from '../ProfileModal'
import { useAuth } from '../../../../hooks/useAuth'
import { Logo } from '../../../../components/widgets'

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
            <Logo />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="My Profile">
                <span>
                  <IconButton
                    onClick={() => setProfileOpen(true)}
                    sx={{ p: 0.5 }}
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
                </span>
              </Tooltip>

              <Tooltip title="Sign out">
                <span>
                  <IconButton
                    onClick={() => signout()}
                    color="inherit"
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(244, 33, 46, 0.1)',
                        color: 'error.main',
                      },
                    }}
                  >
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
