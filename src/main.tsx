import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handler for DOM manipulation errors
window.addEventListener('error', (event) => {
  if (event.error && event.error.name === 'NotFoundError' &&
      event.error.message.includes('removeChild')) {
    console.warn('DOM manipulation error caught globally:', event.error.message);
    event.preventDefault(); // Prevent the error from being logged to console
    return false;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.name === 'NotFoundError' &&
      event.reason.message.includes('removeChild')) {
    console.warn('DOM manipulation promise rejection caught:', event.reason.message);
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
