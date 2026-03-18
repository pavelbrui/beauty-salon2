import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'
import { prerenderReady } from './utils/prerenderReady'

// Global fallback: if no page dispatches prerender-ready within 5s, do it anyway.
// Safe to run unconditionally — in normal browsing the event has no listeners.
setTimeout(prerenderReady, 5000)

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