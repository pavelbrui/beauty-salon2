import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

async function getPrerenderPlugin() {
  try {
    const { default: prerender } = await import('@prerenderer/rollup-plugin');

    // Try to load dynamic routes from build-time generated file
    const routesFile = resolve(process.cwd(), 'prerender-routes.json');
    let prerenderRoutes: string[];

    if (existsSync(routesFile)) {
      prerenderRoutes = JSON.parse(readFileSync(routesFile, 'utf8'));
      console.log(`[prerender] Loaded ${prerenderRoutes.length} routes from prerender-routes.json`);
    } else {
      // Fallback to static routes only
      const publicPages = [
        '/',
        '/services',
        '/stylists',
        '/gallery',
        '/training',
        '/blog',
      ];
      prerenderRoutes = [
        ...publicPages,
        ...publicPages.map(p => `/en${p === '/' ? '/' : p}`),
        ...publicPages.map(p => `/ru${p === '/' ? '/' : p}`),
      ];
      console.log(`[prerender] Using ${prerenderRoutes.length} static fallback routes`);
    }

    return prerender({
      routes: prerenderRoutes,
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        maxConcurrentRoutes: 2,
        renderAfterTime: 4000,
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
