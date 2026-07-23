import type { Context } from '@netlify/edge-functions';

/**
 * Netlify Edge Function: keep URL handling stable without adding redirect chains.
 *
 * We intentionally avoid forcing /path -> /path/ redirects because they can
 * surface in Search Console as “Page with redirect” and “Redirect error”.
 */
export default async (_request: Request, context: Context) => {
  return context.next();
};

export const config = {
  path: '/*',
};
