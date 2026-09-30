import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5185,
    strictPort: true,
  },
  build: {
    // three.js 单块较大，提高告警阈值免得噪音
    chunkSizeWarningLimit: 1200,
  },
});
