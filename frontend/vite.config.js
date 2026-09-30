import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
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
        name: "ShikshaSetu AI",
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
            src: "/ShikshaSetu-pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        skipWaiting: true,
        clientsClaim: true,

        navigateFallback: "/index.html",

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