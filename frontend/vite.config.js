import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Forwards /api calls to the Express backend, so no CORS or URL setup is needed
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
});
