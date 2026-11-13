import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = process.env.VITE_PROXY_TARGET || 'http://localhost:5000';
const proxy = { '/api': backend, '/uploads': backend };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
});
