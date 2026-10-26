import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative base so the build works under GitLab Pages' /<project>/ path
  base: './',
  plugins: [react(), tailwindcss()],
});
