import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  
  // Estrategia de cache mejorada
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false, // Reduced para mejor updateability
  reloadOnOnline: true,
  
  // Limpieza y actualización de caches
  // `skipWaiting` y `clientsClaim` deben ir dentro de `workboxOptions`.
  
  // Las reglas de caching específicas se delegan a `workboxOptions.runtimeCaching`.

  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: false,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      // Cache de API - short-lived
      {
        urlPattern: /^(https?:)?\/api\/.*/i,
        handler: "NetworkFirst" as const,
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutos
          },
          networkTimeoutSeconds: 5,
        },
      },
      // Páginas HTML - network first, cache as fallback
      {
        urlPattern: /^(https?:)?\/(?!_next).*/i,
        handler: "NetworkFirst" as const,
        options: {
          cacheName: "page-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 horas
          },
        },
      },
      // Assets estáticos - cache first
      {
        urlPattern: /^(https?:)?\/(_next|static).*/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "static-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
          },
        },
      },
      // Imágenes - cache first
      {
        urlPattern: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "image-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
          },
        },
      },
    ],
  },

  fallbacks: {
    document: "/offline",
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ]
  },
};

export default withPWA(nextConfig);
