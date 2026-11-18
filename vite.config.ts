import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // './' fa funzionare l'app anche dentro una sottocartella (es. GitHub Pages)
  base: './',
  // Oltre all'app, si pubblica anche la prova grafica: .../app-artigiani/prove/prima-pagina.html
  build: {
    rollupOptions: {
      input: { app: 'index.html', prova: 'prove/prima-pagina.html' },
    },
  },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      // La prova non deve essere sostituita dall'app quando la si apre dal link
      workbox: { navigateFallbackDenylist: [/\/prove\//] },
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
