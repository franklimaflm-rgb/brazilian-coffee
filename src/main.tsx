import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

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
