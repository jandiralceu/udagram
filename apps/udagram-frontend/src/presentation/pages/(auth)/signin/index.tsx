import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, type SubmitHandler, Controller } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'

import type { signinRequest } from '@domain/entities'

import { useAuth } from '../../../hooks/useAuth'
import { Logo, TextInput } from '../../../components/widgets'
import { parseError } from '../../../utils/error_handler'

export const Route = createFileRoute('/(auth)/signin/')({
  component: RouteComponent,
})

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
}) as yup.ObjectSchema<signinRequest>

function RouteComponent() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = Route.useSearch()
  const { signin, isAuthenticating, isAuthenticated } = useAuth()
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<signinRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const { mutate } = useMutation({
    mutationFn: (data: signinRequest) => signin(data),
    onError(error) {
      toast.error(parseError(error).message)
    },
    retry: false,
  })

  const onSubmit: SubmitHandler<signinRequest> = data => {
    mutate(data)
  }

  useEffect(() => {
    if (isAuthenticated) {
      router.navigate({ to: searchParams.redirect || '/' })
    }
  }, [isAuthenticated, router, searchParams.redirect])

  return (
    <Box component="main">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Logo />
        <Typography variant="h2" sx={{ mt: 4 }}>
          Welcome back
        </Typography>
        <Typography variant="body1">Sign in to your account.</Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextInput
                {...field}
                label="Email"
                placeholder="Enter your email"
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextInput
                {...field}
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                error={errors.password?.message}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                }
              />
            )}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ width: '100%' }}
            loading={isAuthenticating}
          >
            Sign In
          </Button>
        </Box>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  textDecoration: 'underline',
                  opacity: 0.8,
                },
              },
            }}
          >
            Don't have an account?
            <Link to="/signup" search={{ redirect: undefined }}>
              Sign up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
