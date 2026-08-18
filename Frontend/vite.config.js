import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Function form required by Vite 8 (rolldown)
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'vendor-recharts';
          }
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'vendor-pdf';
          }
          if (id.includes('node_modules/xlsx') || id.includes('node_modules/docx') || id.includes('node_modules/file-saver')) {
            return 'vendor-export';
          }
          if (id.includes('node_modules/jsbarcode')) {
            return 'vendor-barcode';
          }
          if (id.includes('node_modules/html5-qrcode')) {
            return 'vendor-qr';
          }
          if (id.includes('node_modules/react-hot-toast')) {
            return 'vendor-toast';
          }
          if (id.includes('node_modules/tesseract.js')) {
            return 'vendor-tesseract';
          }
        }
      }
    }
  }
})


