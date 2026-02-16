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
      '@images': '/src/presentation/assets/images',
      '@domain': '/src/domain',
      '@infra': '/src/infra',
      '@presentation': '/src/presentation',
      '@data': '/src/data',
      '@application': '/src/application',
      '@factories': '/src/factories',
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
