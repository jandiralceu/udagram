import path from 'node:path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/presentation/pages',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@data': path.resolve(__dirname, './src/data'),
      '@infra': path.resolve(__dirname, './src/infra'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@factories': path.resolve(__dirname, './src/factories'),
      '@application': path.resolve(__dirname, './src/application'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@images': path.resolve(__dirname, './src/presentation/assets/images'),
    },
  },
  server: {
    port: 5000,
    proxy: {
      '/api/v1/feeds': {
        secure: false,
        changeOrigin: true,
        target: 'http://localhost:5100',
      },
      '/api/v1/auth': {
        secure: false,
        changeOrigin: true,
        target: 'http://localhost:5200',
      },
      '/api/v1/users': {
        secure: false,
        changeOrigin: true,
        target: 'http://localhost:5200',
      },
    },
  },
})
