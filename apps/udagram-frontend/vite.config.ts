import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'node:path'

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
      '@images': path.resolve(__dirname, './src/presentation/assets/images'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@infra': path.resolve(__dirname, './src/infra'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@data': path.resolve(__dirname, './src/data'),
      '@application': path.resolve(__dirname, './src/application'),
      '@factories': path.resolve(__dirname, './src/factories'),
    },
  },
  server: {
    port: 5000,
    proxy: {
      '/api/v1/feeds': {
        target: 'http://localhost:5100',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1/auth': {
        target: 'http://localhost:5200',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1/users': {
        target: 'http://localhost:5200',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
