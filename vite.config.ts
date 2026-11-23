import { defineConfig } from 'vite';

// base: './' so the build works when deployed to a GitHub Pages subdirectory.
export default defineConfig({
  base: './',
  server: {
    // Accept the preview host used by the sandbox environment.
    allowedHosts: true,
  },
});
