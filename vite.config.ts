import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import prerender from '@prerenderer/rollup-plugin'

export default defineConfig({
  plugins: [
    react(),
    prerender({
      routes: [
        '/',
        '/services',
        '/appointments',
        '/stylists',
        '/gallery',
      ],
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        maxConcurrentRoutes: 1,
        renderAfterTime: 3000,
      },
      postProcess(renderedRoute) {
        // Fix title/meta for each route (react-helmet updates them client-side)
        renderedRoute.html = renderedRoute.html.replace(
          /<script\s+type="module"[^>]*><\/script>/g,
          (match) => match
        );
      },
    }),
  ],
})
