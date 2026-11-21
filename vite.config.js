import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Everything under /api is forwarded to the Spring Cloud API Gateway (port 8083).
// Because the browser only ever talks to localhost:3000, there are no CORS problems in development.
const gateway = {
  '/api': { target: process.env.VITE_GATEWAY_URL || 'http://localhost:8083', changeOrigin: true },
};

export default defineConfig({
  // GitHub Pages serves a project site from /<repo-name>/. The workflow sets VITE_BASE; local dev keeps '/'.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: { port: 3000, proxy: gateway },
  preview: { port: 3000, proxy: gateway },
});
