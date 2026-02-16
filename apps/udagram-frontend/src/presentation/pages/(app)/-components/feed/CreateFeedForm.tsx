import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import FormHelperText from '@mui/material/FormHelperText'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, useWatch } from 'react-hook-form'
import PhotoIcon from '@mui/icons-material/ImageOutlined'
import GifIcon from '@mui/icons-material/GifBoxOutlined'
import PollIcon from '@mui/icons-material/PollOutlined'
import EmojiIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined'
import ScheduleIcon from '@mui/icons-material/CalendarTodayOutlined'
import LocationIcon from '@mui/icons-material/LocationOnOutlined'
import CloseIcon from '@mui/icons-material/Close'
import { toast } from 'sonner'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { FeedFactory } from '@factories/index'
import type { CreateFeedRequest } from '@domain/entities'

import { useAuth } from '../../../../hooks/useAuth'
import { QueryKeys } from '../../../../utils/constants'

const MAX_CHARS = 280

const schema = yup.object().shape({
  caption: yup
    .string()
    .required('A caption is required')
    .max(MAX_CHARS, `Post must be less than ${MAX_CHARS} characters`),
  file: yup.mixed<File>().required('An image is required'),
})

const feedRepository = FeedFactory.createRepository()

export function CreateFeedForm() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateFeedRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      caption: '',
    },
    mode: 'onChange',
  })

  const caption = useWatch({ control, name: 'caption', defaultValue: '' })
  const file = useWatch({ control, name: 'file' })

  // Derive preview URL from the file in the form state
  const imagePreview = file ? URL.createObjectURL(file) : null

  // Cleanup object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: CreateFeedRequest) => feedRepository.createFeed(data),
    onSuccess: () => {
      toast.success('Wait, that was cool! Your post is live.')
      reset({ caption: '', file: undefined as unknown as File })
      if (fileInputRef.current) fileInputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: [QueryKeys.feeds] })
    },
    onError: () => {
      toast.error('Something went wrong. Please try again.')
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setValue('file', selectedFile, { shouldValidate: true })
    }
  }

  const handleRemoveImage = () => {
    // Using unknown cast instead of any to satisfy lint while maintaining functionality
    setValue('file', undefined as unknown as File, { shouldValidate: true })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: CreateFeedRequest) => {
    await mutateAsync(data)
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
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: 'flex', gap: 1.5 }}
      >
        <Avatar
          src={user?.avatar ?? undefined}
          sx={{ width: 40, height: 40, mt: 0.5 }}
        />

        <Box sx={{ flex: 1 }}>
          <Box sx={{ pt: 1 }}>
            <Controller
              name="caption"
              control={control}
              render={({ field }) => (
                <InputBase
                  {...field}
                  multiline
                  fullWidth
                  placeholder="What's happening?"
                  sx={{
                    fontSize: '1.25rem',
                    color: 'text.primary',
                    '& .MuiInputBase-input::placeholder': {
                      opacity: 0.7,
                    },
                  }}
                />
              )}
            />
            {errors.caption && (
              <FormHelperText error>{errors.caption.message}</FormHelperText>
            )}
          </Box>

          {imagePreview && (
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
                src={imagePreview}
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
                disabled={isPending}
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
          {errors.file && !imagePreview && (
            <FormHelperText error>{errors.file.message}</FormHelperText>
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
                  disabled={isPending}
                >
                  <PhotoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="GIF">
                <IconButton color="primary" disabled>
                  <GifIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Poll">
                <IconButton color="primary" disabled>
                  <PollIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Emoji">
                <IconButton color="primary" disabled>
                  <EmojiIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Schedule">
                <IconButton color="primary" disabled>
                  <ScheduleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Location">
                <IconButton color="primary" disabled>
                  <LocationIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {charCount > 0 && (
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
                disabled={!isValid || isPending}
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
                {isPending ? 'Posting...' : 'Post'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
