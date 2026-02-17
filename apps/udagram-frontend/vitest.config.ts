import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, './src/test-setup.ts')],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    alias: {
      '@images': path.resolve(__dirname, './src/presentation/assets/images'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@infra': path.resolve(__dirname, './src/infra'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@data': path.resolve(__dirname, './src/data'),
      '@application': path.resolve(__dirname, './src/application'),
      '@factories': path.resolve(__dirname, './src/factories'),
    },
    exclude: ['**/node_modules/**', '**/dist/**', 'src/presentation/assets/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'src/presentation/assets/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
      thresholds: {
        lines: 5,
        functions: 5,
        branches: 5,
        statements: 5,
      },
    },
  },
})
