/**
 * Signal to the prerenderer that the page is fully rendered and ready for HTML capture.
 * Uses `renderAfterDocumentEvent: 'prerender-ready'` in @prerenderer/renderer-puppeteer.
 * Safe to call multiple times — only the first call dispatches the event.
 */
let dispatched = false;

export function prerenderReady(): void {
  if (dispatched) return;
  dispatched = true;
  document.dispatchEvent(new Event('prerender-ready'));
}
