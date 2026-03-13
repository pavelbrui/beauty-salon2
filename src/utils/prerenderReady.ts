/**
 * Signal to the prerenderer that the page is fully rendered and ready for HTML capture.
 * Uses `renderAfterDocumentEvent: 'prerender-ready'` in @prerenderer/renderer-puppeteer.
 * Safe to call multiple times — only the first call dispatches the event.
 *
 * IMPORTANT: Uses a delayed dispatch (double-rAF + setTimeout) to ensure React has
 * re-rendered with updated state and react-helmet-async has flushed its DOM changes
 * (title, meta, canonical, hreflang) before the prerenderer captures the HTML.
 */
let dispatched = false;

export function prerenderReady(): void {
  if (dispatched) return;
  dispatched = true;

  // Double requestAnimationFrame ensures React has committed its render,
  // then a short setTimeout gives Helmet time to flush DOM updates.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.dispatchEvent(new Event('prerender-ready'));
      }, 200);
    });
  });
}
