import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunk: cached across deploys while app code changes.
        manualChunks(id) {
          if (
            /node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler|axios)[\/]/.test(
              id
            )
          ) {
            return "vendor";
          }
        },
      },
    },
  },

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      devOptions: {
        enabled: true,
      },

      includeAssets: [
        "favicon.ico",
        "ShikshaSetu-pwa-512.png",
      ],

      manifest: {
        name: "ShikshaSetu | AI EDUCATION",
        short_name: "ShikshaSetu",
        description:
          "Inclusive digital learning platform for rural and tribal students.",

        theme_color: "#11162b",
        background_color: "#f7f8fc",

        display: "standalone",

        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "/favicon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/ShikshaSetu-pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        // Push notification handlers (public/push-sw.js)
        importScripts: ["push-sw.js"],

        skipWaiting: true,
        clientsClaim: true,

        navigateFallback: "/index.html",

        // Precache the app shell AND its images/manifest, so the logo and
        // icons also work on the very first offline start.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        // Never serve the SPA shell for the push worker script.
        navigateFallbackDenylist: [/^\/push-sw\.js$/],

        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/fonts\.googleapis\.com\/.*/i,

            handler: "CacheFirst",

            options: {
              cacheName: "google-fonts",

              expiration: {
                maxEntries: 10,
                maxAgeSeconds:
                  60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
});