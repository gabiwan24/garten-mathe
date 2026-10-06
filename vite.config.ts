import { svelte } from '@sveltejs/vite-plugin-svelte';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// HTTPS + host: the phone on the LAN needs a secure context for motion sensors.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    svelte(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Garten-Mathe',
        short_name: 'Garten',
        description: 'Rechnen üben bis 20 im eigenen Garten',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#E4EFEA',
        theme_color: '#4E9A5B',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'] },
    }),
  ],
  // Empty inline config stops Vite from searching up for a parent postcss.config.js.
  css: { postcss: {} },
  server: { host: true },
});
