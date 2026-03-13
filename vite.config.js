import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for the project
  base: './',
  build: {
    outDir: 'dist',
    // Ensure the build fails if there are errors
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true
  }
});
