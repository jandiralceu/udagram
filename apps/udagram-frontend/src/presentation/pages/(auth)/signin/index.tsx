import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, type SubmitHandler, Controller } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'

import type { signinRequest } from '@domain/entities'
import { useAuth } from '@presentation/hooks/useAuth'
import { TextInput } from '@presentation/components/widgets'

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
  const router = useRouter()
  const searchParams = Route.useSearch()
  const { signin } = useAuth()
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

  const { mutateAsync } = useMutation({
    mutationFn: async (data: signinRequest) => signin(data),
    onSuccess: () => {
      router.navigate({ to: searchParams.redirect || '/' })
    },
    onError(_error) {
      toast.error('Error signing in')
    },
    retry: false,
  })

  const onSubmit: SubmitHandler<signinRequest> = async data => {
    await mutateAsync(data)
  }

  return (
    <Box component="main">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2">Welcome back</Typography>
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
                type="password"
                label="Password"
                error={errors.password?.message}
              />
            )}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ width: '100%' }}
          >
            Sign In
          </Button>
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ fontSize: '0.7rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" search={{ redirect: undefined }}>
              Sign up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
