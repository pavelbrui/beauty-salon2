import type { Context } from '@netlify/edge-functions';

/**
 * Netlify Edge Function: enforce trailing slashes on all HTML page URLs.
 *
 * Redirects /path → /path/ (301) so Google sees a single canonical URL.
 * Skips static assets (files with extensions) and API/function paths.
 */
export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const { pathname } = url;

  // Skip: already has trailing slash, root path, or looks like a file (has extension)
  if (
    pathname === '/' ||
    pathname.endsWith('/') ||
    /\.\w{2,10}$/.test(pathname) ||
    pathname.startsWith('/.netlify/') ||
    pathname.startsWith('/api/')
  ) {
    return context.next();
  }

  // 301 redirect to trailing-slash version
  url.pathname = `${pathname}/`;
  return Response.redirect(url.toString(), 301);
};

export const config = {
  path: '/*',
};
