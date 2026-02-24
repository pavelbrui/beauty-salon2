import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isNetlify = !!process.env.NETLIFY;

// Prerendering requires Chrome/Puppeteer — only available locally, not on Netlify CI
async function getPrerenderPlugin() {
  if (isNetlify) return null;

  try {
    const { default: prerender } = await import('@prerenderer/rollup-plugin');
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
    return prerender({
      routes: prerenderRoutes,
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        maxConcurrentRoutes: 1,
        renderAfterTime: 3000,
      },
      postProcess(renderedRoute) {
        renderedRoute.html = renderedRoute.html
          .replace(/\s{2,}/g, ' ');
        return renderedRoute;
      },
    });
  } catch {
    console.warn('Prerender plugin not available — skipping prerendering');
    return null;
  }
}

export default defineConfig(async () => {
  const prerenderPlugin = await getPrerenderPlugin();

  return {
    plugins: [
      react(),
      ...(prerenderPlugin ? [prerenderPlugin] : []),
    ],
  };
})
