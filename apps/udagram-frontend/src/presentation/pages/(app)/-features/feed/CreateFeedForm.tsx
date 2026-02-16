import { useState, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'

import PhotoIcon from '@mui/icons-material/ImageOutlined'
import CloseIcon from '@mui/icons-material/Close'

import { useAuth } from '../../../../hooks/useAuth'

const MAX_CHARS = 280

export function CreateFeedForm() {
  const { user } = useAuth()
  const [caption, setCaption] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!caption.trim() && !image) return

    console.log({ caption, image })
    setCaption('')
    setImage(null)
  }

  const charCount = caption.length
  const isOverLimit = charCount > MAX_CHARS
  const progress = Math.min((charCount / MAX_CHARS) * 100, 100)

  return (
    <Box
      sx={{
        py: 1,
        px: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', gap: 1.5 }}
      >
        <Avatar
          src={user?.avatar ?? undefined}
          sx={{ width: 40, height: 40, mt: 0.5 }}
        />

        <Box sx={{ flex: 1 }}>
          <Box sx={{ pt: 1 }}>
            <InputBase
              multiline
              fullWidth
              placeholder="What's happening?"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              sx={{
                fontSize: '1.25rem',
                color: 'text.primary',
                '& .MuiInputBase-input::placeholder': {
                  opacity: 0.7,
                },
              }}
            />
          </Box>

          {image && (
            <Box
              sx={{
                position: 'relative',
                mt: 1.5,
                mb: 1,
                borderRadius: 4,
                overflow: 'hidden',
                width: '100%',
                maxHeight: 512,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                component="img"
                src={image}
                sx={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  maxHeight: 512,
                  objectFit: 'cover',
                }}
              />
              <IconButton
                onClick={handleRemoveImage}
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  bgcolor: 'rgba(15, 20, 25, 0.75)',
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                  '&:hover': { bgcolor: 'rgba(39, 44, 48, 0.75)' },
                }}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          <Divider sx={{ mb: 1.5, mx: 0 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', ml: -1 }}>
              <input
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <Tooltip title="Media">
                <IconButton
                  color="primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PhotoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {caption.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress
                    variant="determinate"
                    value={progress}
                    size={22}
                    thickness={4}
                    sx={{
                      color: isOverLimit ? 'error.main' : 'primary.main',
                      opacity: charCount > MAX_CHARS - 20 ? 1 : 0.5,
                    }}
                  />
                  {charCount > MAX_CHARS - 20 && (
                    <Box
                      sx={{
                        ml: 1,
                        fontSize: '0.75rem',
                        color: isOverLimit ? 'error.main' : 'text.secondary',
                      }}
                    >
                      {MAX_CHARS - charCount}
                    </Box>
                  )}
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={(!caption.trim() && !image) || isOverLimit}
                sx={{
                  boxShadow: 'none',
                  py: 0.8,
                  px: 2.5,
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  '&.Mui-disabled': {
                    bgcolor: 'primary.main',
                    opacity: 0.5,
                    color: 'white',
                  },
                }}
              >
                Post
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
