import log from 'loglevel'
import { useRef } from 'react'
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
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@presentation/hooks/useAuth'
import { UserFactory } from '@factories/index'
import { QueryKeys } from '@presentation/utils/constants'

type Props = {
  open: boolean
  onClose: () => void
}

const userRepository = UserFactory.createRepository()

export function ProfileModal({ open, onClose }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutate, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => userRepository.updateAvatar(file),
    onSuccess: () => {
      toast.success('Avatar updated successfully!')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.me] })
    },
    onError: error => {
      toast.error('Error updating avatar. Please try again.')
      log.error('Error updating avatar:', error)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      mutate(file)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          onClose()
        }
      }}
      fullWidth
      maxWidth="xs"
      disableRestoreFocus
    >
      <DialogTitle
        component="div"
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" fontWeight={800}>
          Profile
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

          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'block', mb: 1 }}
            >
              MEMBER SINCE
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
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
