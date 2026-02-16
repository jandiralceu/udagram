import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { createFileRoute, Link } from '@tanstack/react-router'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, type SubmitHandler, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'

import type { signupRequest } from '@domain/entities'
import { useAuth } from '@presentation/hooks/useAuth'
import {
  TextInput,
  TermsAcceptanceField,
} from '@presentation/components/widgets/inputs'

export const Route = createFileRoute('/(auth)/signup/')({
  component: RouteComponent,
})

type SignupForm = signupRequest & {
  termsAccepted: boolean
}

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  termsAccepted: yup
    .boolean()
    .oneOf([true], 'You must accept the terms and conditions'),
}) as yup.ObjectSchema<SignupForm>

function RouteComponent() {
  const { signup } = useAuth()
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<SignupForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      termsAccepted: false,
    },
  })

  const { mutateAsync } = useMutation({
    mutationFn: async (data: signupRequest) => signup(data),
    onSuccess: () => {
      toast.success('User created successfully')
    },
    onError(_error) {
      toast.error('Error creating user')
    },
    retry: false,
  })

  const onSubmit: SubmitHandler<SignupForm> = async data => {
    const { termsAccepted: _unused, ...signupData } = data
    await mutateAsync(signupData)
  }

  return (
    <Box component="main">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2">Create an account</Typography>
        <Typography variant="body1">
          Join the community and share your photos with the world.
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput {...field} label="Name" error={errors.name?.message} />
            )}
          />
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
          <Controller
            control={control}
            name="termsAccepted"
            render={({ field }) => (
              <TermsAcceptanceField
                checked={field.value}
                onChange={field.onChange}
                label="I accept the terms and conditions"
                error={errors.termsAccepted?.message}
              />
            )}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ width: '100%' }}
          >
            Create Account
          </Button>
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ fontSize: '0.7rem' }}>
            Already have an account?{' '}
            <Link to="/signin" search={{ redirect: undefined }}>
              Sign in
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
