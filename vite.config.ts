import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const loadPrerenderRoutes = (): string[] => {
  const routesPath = resolve(process.cwd(), 'prerender-routes.json')
  if (!existsSync(routesPath)) return ['/']
  try {
    return JSON.parse(readFileSync(routesPath, 'utf-8'))
  } catch {
    return ['/']
  }
}

export default defineConfig(async ({ command }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugins: any[] = [react()]

  if (command === 'build') {
    try {
      const { default: prerender } = await import('@prerenderer/rollup-plugin')
      const routes = loadPrerenderRoutes()

      plugins.push(
        prerender({
          routes,
          renderer: '@prerenderer/renderer-puppeteer',
          rendererOptions: {
            maxConcurrentRoutes: 4,
            renderAfterTime: 5000,
          },
        })
      )
      console.log(`[prerender] Configured ${routes.length} routes for prerendering`)
    } catch {
      console.warn('[prerender] Plugin not available, skipping prerendering')
    }
  }

  return { plugins }
})
