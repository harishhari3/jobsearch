import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rzpAuth = `Basic ${Buffer.from(`${env.VITE_RAZORPAY_KEY_ID || ''}:${env.VITE_RAZORPAY_KEY_SECRET || ''}`).toString('base64')}`
  const hasRzpKeys = Boolean(env.VITE_RAZORPAY_KEY_ID && env.VITE_RAZORPAY_KEY_SECRET)

  const rzpProxy = hasRzpKeys
    ? {
        '/rzp': {
          target: 'https://api.razorpay.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/rzp/, ''),
          headers: { Authorization: rzpAuth },
        },
      }
    : {}

  const proxy = {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
    ...rzpProxy,
    '/jobs-api': {
      target: 'https://api.adzuna.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/jobs-api/, ''),
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'framer-motion',
        'lucide-react',
        'pdfjs-dist',
      ],
      noDiscovery: true,
    },
    server: {
      allowedHosts: ['.monkeycode-ai.live'],
      proxy,
    },
    preview: {
      allowedHosts: ['.monkeycode-ai.live'],
      proxy,
    },
  }
})
