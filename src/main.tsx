import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FaroErrorBoundary } from '@grafana/faro-react'
import { initFaro } from './faro'
import './index.css'
import App from './App.tsx'

initFaro();

async function enableMocking() {
  if (!import.meta.env.DEV) {
    return;
  }
  const { worker } = await import('./mocks/browser.ts');
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <FaroErrorBoundary>
        <App />
      </FaroErrorBoundary>
    </StrictMode>,
  )
});
