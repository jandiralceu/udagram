import log from 'loglevel'
import { useState, useRef } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import CameraIcon from '@mui/icons-material/PhotoCamera'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import { toast } from 'sonner'

import { useAuth } from '@presentation/hooks/useAuth'

type Props = {
  open: boolean
  onClose: () => void
}

export function ProfileModal({ open, onClose }: Props) {
  const { user, updateAvatar } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      await updateAvatar(file)
      toast.success('Avatar atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar avatar. Tente novamente.')
      log.error('Error updating avatar:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" fontWeight={800}>
          Perfil
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pb: 4 }}>
        <Stack spacing={3} alignItems="center" sx={{ mt: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user?.avatar}
              sx={{
                width: 120,
                height: 120,
                border: '4px solid',
                borderColor: 'background.paper',
                boxShadow: 3,
              }}
            />
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              {isUploading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <CameraIcon />
              )}
            </IconButton>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
            />
          </Box>

          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              {user?.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>

          <Box sx={{ width: '100%', pt: 2 }}>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'block', mb: 1 }}
            >
              MEMBRO DESDE
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })
                : '-'}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
