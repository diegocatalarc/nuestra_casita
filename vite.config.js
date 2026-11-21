import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { execSync } from 'node:child_process';
const build = (() => { let h = 'sin-git'; try { h = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* sin git */ } return `${h} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`; })();

export default defineConfig({
  define: { __BUILD__: JSON.stringify(build) },
  plugins: [react()],
  build: {
    assetsInlineLimit: 1000000,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
