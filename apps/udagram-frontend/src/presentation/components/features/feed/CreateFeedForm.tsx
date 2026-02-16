import { useState, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import PhotoIcon from '@mui/icons-material/Photo'
import CloseIcon from '@mui/icons-material/Close'
import { TextArea } from '../../widgets/inputs'

export function CreateFeedForm() {
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
    // Dispatch the create feed operation
    console.log({ caption, image })
    setCaption('')
    setImage(null)
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        mb: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar sx={{ width: 48, height: 48 }} />
          <Box sx={{ flex: 1 }}>
            <TextArea
              value={caption}
              onChange={setCaption}
              placeholder="What's happening?"
              rows={2}
              textFieldProps={{
                variant: 'standard',
                InputProps: {
                  disableUnderline: true,
                },
              }}
              sx={{ mb: 1 }}
            />

            {image && (
              <Box
                sx={{
                  position: 'relative',
                  mt: 2,
                  borderRadius: 2,
                  overflow: 'hidden',
                  width: '100%',
                  maxHeight: 400,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Box
                  component="img"
                  src={image}
                  sx={{
                    maxWidth: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
                <IconButton
                  onClick={handleRemoveImage}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  }}
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1,
                pt: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
                <IconButton
                  color="primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PhotoIcon />
                </IconButton>
              </Box>
              <Button
                type="submit"
                variant="contained"
                disabled={!caption.trim() && !image}
                sx={{
                  borderRadius: 20,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 3,
                }}
              >
                Post
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}
