// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests starting with /api to your backend server
      '/api': {
        target: 'http://localhost:5000', // Your backend server address
        changeOrigin: true,
        // Optional: rewrite path if needed, e.g., remove /api prefix
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
});