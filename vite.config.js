import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { execSync } from 'node:child_process';
const build = (() => { let h = 'sin-git'; try { h = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* sin git */ } return `${h} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`; })();

export default defineConfig({
  define: { __BUILD__: JSON.stringify(build) },
  plugins: [react()],
  build: {
    // Los modelos .glb no se incrustan en el JS (base64 dentro del chunk de entrada): se piden por separado.
    assetsInlineLimit: (file, content) => (file.endsWith('.glb') ? !!process.env.NC_INLINE_GLB : content.length < 1000000), // NC_INLINE_GLB=1 (Artifact de claude.ai, que no sirve .glb): los incrusta como antes
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
