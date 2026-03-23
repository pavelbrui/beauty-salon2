import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE_URL = 'https://katarzynabrui.pl'

const loadPrerenderRoutes = (): string[] => {
  const routesPath = resolve(process.cwd(), 'prerender-routes.json')
  if (!existsSync(routesPath)) return ['/']
  try {
    return JSON.parse(readFileSync(routesPath, 'utf-8'))
  } catch {
    return ['/']
  }
}

/**
 * postProcess hook for the prerenderer.
 * Ensures react-helmet-async meta tags were properly injected into the prerendered HTML.
 * If Helmet didn't update the <head> (e.g., due to timing), this fixes the canonical URL
 * so Google doesn't treat every page as the homepage.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fixHelmetMeta = (route: any) => {
  const html: string = route.html
  const routePath: string = route.route

  // Check if Helmet injected its tags (data-rh attribute is the marker)
  const helmetWorked = html.includes('data-rh="true"') || html.includes('data-rh=')

  if (helmetWorked) {
    // Helmet ran correctly — no fixes needed
    return
  }

  // Helmet did NOT inject tags. Fix the most critical SEO issues:
  console.warn(`[prerender] WARNING: Helmet did not inject meta tags for ${routePath}`)

  // 1. Fix canonical URL (most critical — wrong canonical = not indexed)
  const correctCanonical = `${BASE_URL}${routePath === '/' ? '' : routePath}`
  route.html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${correctCanonical}">`
  )

  // 2. Fix hreflang tags to point to the correct page (not homepage)
  const barePath = routePath.replace(/^\/(en|ru)\//, '/').replace(/^\/(en|ru)$/, '/')
  const plPath = barePath === '/' ? '' : barePath
  const enPath = `/en${barePath === '/' ? '/' : barePath}`
  const ruPath = `/ru${barePath === '/' ? '/' : barePath}`

  route.html = route.html
    .replace(
      /<link rel="alternate" hreflang="pl" href="[^"]*">/,
      `<link rel="alternate" hreflang="pl" href="${BASE_URL}${plPath}">`
    )
    .replace(
      /<link rel="alternate" hreflang="en" href="[^"]*">/,
      `<link rel="alternate" hreflang="en" href="${BASE_URL}${enPath}">`
    )
    .replace(
      /<link rel="alternate" hreflang="ru" href="[^"]*">/,
      `<link rel="alternate" hreflang="ru" href="${BASE_URL}${ruPath}">`
    )
    .replace(
      /<link rel="alternate" hreflang="x-default" href="[^"]*">/,
      `<link rel="alternate" hreflang="x-default" href="${BASE_URL}${plPath}">`
    )

  // 3. Fix og:url
  route.html = route.html.replace(
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${correctCanonical}">`
  )

  // 4. Fix html lang attribute for /en/ and /ru/ routes
  if (routePath.startsWith('/en')) {
    route.html = route.html.replace('<html lang="pl">', '<html lang="en">')
  } else if (routePath.startsWith('/ru')) {
    route.html = route.html.replace('<html lang="pl">', '<html lang="ru">')
  }
}

export default defineConfig(async ({ command }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugins: any[] = [react()]

  if (command === 'build' && process.env.SKIP_PRERENDER !== '1') {
    try {
      const { default: prerender } = await import('@prerenderer/rollup-plugin')
      const routes = loadPrerenderRoutes()

      plugins.push(
        prerender({
          routes,
          renderer: '@prerenderer/renderer-puppeteer',
          rendererOptions: {
            maxConcurrentRoutes: 2,
            renderAfterDocumentEvent: 'prerender-ready',
            timeout: 45000,
          },
          postProcess: fixHelmetMeta,
        })
      )
      console.log(`[prerender] Configured ${routes.length} routes for prerendering`)
    } catch {
      console.warn('[prerender] Plugin not available, skipping prerendering')
    }
  }

  return {
    plugins,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/src/data/landingPages.ts')) return 'landing-pages-data'
            if (id.includes('/src/i18n/translations.ts')) return 'translations'

            if (!id.includes('node_modules')) return undefined

            if (id.includes('framer-motion')) return 'vendor-motion'
            if (id.includes('@supabase/supabase-js')) return 'vendor-supabase'
            if (id.includes('date-fns')) return 'vendor-date'
            if (
              id.includes('react-icons') ||
              id.includes('@heroicons/react') ||
              id.includes('@headlessui/react')
            ) {
              return 'vendor-icons'
            }
            return 'vendor-misc'
          },
        },
      },
    },
  }
})
