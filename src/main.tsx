import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

// One-time cleanup: unregister stale Service Workers and clear caches from
// previous builds that may have pointed at an old backend URL. Runs once per
// browser (guarded by localStorage flag) to avoid reload loops.
(async () => {
  try {
    const FLAG = 'sw-reset-v3';
    if (typeof window === 'undefined' || localStorage.getItem(FLAG)) return;
    let cleaned = false;
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
        cleaned = true;
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
        cleaned = true;
      }
    }
    localStorage.setItem(FLAG, '1');
    if (cleaned) {
      location.reload();
    }
  } catch (err) {
    console.warn('SW cleanup failed:', err);
  }
})();


// Global error handler for DOM manipulation errors
window.addEventListener('error', (event) => {
  if (event.error && event.error.name === 'NotFoundError' &&
      event.error.message.includes('removeChild')) {
    console.warn('DOM manipulation error caught globally:', event.error.message);
    event.preventDefault();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.name === 'NotFoundError' &&
      event.reason.message.includes('removeChild')) {
    console.warn('DOM manipulation promise rejection caught:', event.reason.message);
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
