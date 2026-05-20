import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Make sure this path exactly matches where your setupTests.js lives!
    setupFiles: ['./src/setupTests.js'], 
    testTimeout: 30000,
    
    // This replicates your Jest coverage settings
    coverage: {
      enabled: true,
      provider: 'v8', // or 'istanbul' depending on your package.json
      reportsDirectory: './coverage',
      include: [
        'src/pages/**/*.{js,jsx}',
        'src/components/**/*.{js,jsx}',
        'src/context/**/*.{js,jsx}',
      ],
    },
    
    server: {
      deps: {
        inline: ['react-router', 'react-router-dom']
      }
    }
  }
})