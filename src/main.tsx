import React, {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import { installApiBaseFetch } from './lib/apiBase';
import { installLoudAudio } from './lib/loudAudio';
import { initDesktopTitleBar } from './lib/desktopTitleBar';
import { applySupportProfile, useSupportProfile } from './lib/support/profile';
import { MotionConfig } from 'motion/react';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

installApiBaseFetch();
// every sound louder and on both speakers (phones with one broken speaker)
installLoudAudio();
initDesktopTitleBar();
// "Hỗ trợ học tập" (bigger text, contrast, fewer effects) before the first paint
applySupportProfile();

// ?desktopLogin=<session> is the sign-in page the desktop app opens in the normal browser
const DesktopLoginBridge = lazy(() => import('./components/DesktopLoginBridge.tsx'));
const desktopLoginSession = new URLSearchParams(window.location.search).get('desktopLogin');

// motion/react animations ignore CSS, so "Bớt hiệu ứng" (or the phone's setting) is passed to them here
function MotionPrefs({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion={useSupportProfile().reduceMotion ? 'always' : 'user'}>{children}</MotionConfig>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {desktopLoginSession ? (
        <Suspense fallback={null}>
          <DesktopLoginBridge session={desktopLoginSession} />
        </Suspense>
      ) : (
        <MotionPrefs>
          <App />
        </MotionPrefs>
      )}
    </ErrorBoundary>
  </StrictMode>,
);
