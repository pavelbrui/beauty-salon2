import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'
import { prerenderReady } from './utils/prerenderReady'

// Global fallback: if no page dispatches prerender-ready within 10s, do it anyway
if ((window as unknown as { __PRERENDER_STATUS?: unknown }).__PRERENDER_STATUS) {
  setTimeout(prerenderReady, 10000)
}

const container = document.getElementById('app')

if (!container) {
  throw new Error('Failed to find the root element')
}

const root = createRoot(container)
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
)