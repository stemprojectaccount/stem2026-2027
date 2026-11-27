import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {defineConfig} from 'vite';

// The Google Web client ID is public (it ships in every Google sign-in page), so it is read
// from api-keys.env at build time. The Gemini key in that file is never exposed to the browser.
function readGoogleWebClientId(): string {
  const file = path.resolve(__dirname, 'api-keys.env');
  if (!fs.existsSync(file)) return '';
  return (dotenv.parse(fs.readFileSync(file)).GOOGLE_WEB_CLIENT_ID || '').trim();
}

export default defineConfig(() => {
  return {
    define: {
      'import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID': JSON.stringify(readGoogleWebClientId()),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // The dev server is reachable on the local network (phone testing), so secrets and
      // non-web project files must never be served: Vite only blocks ".env*" by default.
      fs: {
        deny: [
          '.env', '.env.*', '*.{crt,pem}', '**/.git/**',
          'api-keys.env', '**/api-keys.env', '**/api-keys/**',
          '**/keystore.properties', '**/local.properties', '*.jks', '**/*.jks', '*.keystore', '**/*.keystore',
          '**/android/**', '**/desktop/**', '**/scripts/**', '**/release/**',
          'server.ts', '**/server.ts', '**/src/server/**',
        ],
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
