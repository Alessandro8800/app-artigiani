import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // './' fa funzionare l'app anche dentro una sottocartella (es. GitHub Pages)
  base: './',
  // Pagina principale = la prova grafica (index.html).
  // La prima versione resta in .../prima-versione/ (con i suoi dati), il vecchio link della prova porta alla principale.
  build: {
    rollupOptions: {
      input: { app: 'index.html', primaVersione: 'prima-versione/index.html', vecchioLink: 'prove/prima-pagina.html' },
    },
  },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      // Queste pagine non devono essere sostituite dalla principale quando si aprono dal link
      workbox: { navigateFallbackDenylist: [/\/prove\//, /\/prima-versione\//] },
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Lavori e Pagamenti',
        short_name: 'Lavori',
        description: 'Segna i lavori e chi ti deve soldi',
        lang: 'it',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#1f6f43',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
