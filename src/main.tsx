import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { configureMetaPixel, MetaPixelProvider, MetaPixel } from 'scoretrack';

const pixelId = import.meta.env.VITE_META_PIXEL_ID || '2607151959787465';
const localDryRun = import.meta.env.DEV || ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
configureMetaPixel({ PIXEL_ID: pixelId, LOCAL_DRY_RUN: localDryRun, VERBOSE: localDryRun });
if (localDryRun) {
  try { localStorage.setItem('meta-pixel-debug', 'true'); } catch { /* Storage can be blocked. */ }
  console.info('META_CONFIG', { framework: 'vite', dry_run: true, token: 'server-only' });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MetaPixelProvider>
      <App />
      <MetaPixel pixelId={pixelId} />
    </MetaPixelProvider>
  </StrictMode>,
);
