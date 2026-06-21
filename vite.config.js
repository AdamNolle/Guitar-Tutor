import { defineConfig } from 'vite';

// GitHub Pages serves from https://<user>.github.io/Guitar-Tutor/ — the repo-name subpath.
// Override with BASE_PATH=/ for a root/custom-domain deploy.
const base = process.env.BASE_PATH || '/Guitar-Tutor/';

export default defineConfig({
  base,
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
});
