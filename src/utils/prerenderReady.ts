/**
 * Signal to the prerenderer that the page is fully rendered and ready for HTML capture.
 * Uses `renderAfterDocumentEvent: 'prerender-ready'` in @prerenderer/renderer-puppeteer.
 * Safe to call multiple times — only the first call dispatches the event.
 *
 * Uses setTimeout (not requestAnimationFrame) to ensure compatibility with headless
 * Puppeteer on CI servers where rAF may not fire. The 300ms delay gives React time
 * to commit its re-render and react-helmet-async time to flush DOM changes
 * (title, meta, canonical, hreflang) before the prerenderer captures the HTML.
 */
let dispatched = false;

export function prerenderReady(): void {
  if (dispatched) return;
  dispatched = true;

  // setTimeout is reliable in headless Puppeteer (unlike requestAnimationFrame).
  // 300ms is enough for React to re-render and Helmet to update the <head>.
  setTimeout(() => {
    document.dispatchEvent(new Event('prerender-ready'));
  }, 300);
}
