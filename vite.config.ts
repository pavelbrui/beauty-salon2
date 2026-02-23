import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import prerender from '@prerenderer/rollup-plugin'

const publicPages = [
  '/',
  '/services',
  '/stylists',
  '/gallery',
  '/training',
  '/blog',
];

const prerenderRoutes = [
  ...publicPages,
  ...publicPages.map(p => `/en${p === '/' ? '/' : p}`),
  ...publicPages.map(p => `/ru${p === '/' ? '/' : p}`),
];

export default defineConfig({
  plugins: [
    react(),
    prerender({
      routes: prerenderRoutes,
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        maxConcurrentRoutes: 1,
        renderAfterTime: 3000,
      },
      postProcess(renderedRoute) {
        // Keep module scripts in prerendered HTML so React can hydrate and handle button clicks.
        renderedRoute.html = renderedRoute.html
          .replace(/\s{2,}/g, ' ');
        return renderedRoute;
      },
    }),
  ],
})
