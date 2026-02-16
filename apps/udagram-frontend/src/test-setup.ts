import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Optional: cleanup after each test
afterEach(() => {
  cleanup()
})
