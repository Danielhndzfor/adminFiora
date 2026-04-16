"use client";

import { useEffect } from "react";

const CACHE_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas en ms
const CACHE_CLEANUP_KEY = "pwa-last-cache-cleanup";

/**
 * Hook para limpiar cache automáticamente cada 24 horas
 * 
 * ✅ Beneficios:
 * - Evita acumulación de basura en cache
 * - Previene contenido desactualizado quedado atrapado
 * - Mejora stabilidad y performance del PWA
 * - Se ejecuta silenciosamente sin interrumpir al usuario
 * 
 * ⚠️ Nota:
 * - La limpieza ocurre solo si han pasado 24h desde última limpieza
 * - Se ejecuta en background (no bloquea la UI)
 * - Si el usuario cierra la app, se reanuda en 24h desde último intento
 */
export function usePWACacheCleaner() {
  useEffect(() => {
    const cleanupCache = async () => {
      try {
        const now = Date.now();
        const lastCleanup = localStorage.getItem(CACHE_CLEANUP_KEY);

        // Si nunca se limpió o hace más de 24h, limpiar
        const shouldCleanup =
          !lastCleanup || now - parseInt(lastCleanup, 10) > CACHE_CLEANUP_INTERVAL;

        if (!shouldCleanup) {
          return;
        }

        // Obtener todos los caches
        const cacheNames = await caches.keys();

        // Limpiar todos (sin mostrar notificación)
        await Promise.all(cacheNames.map((name) => caches.delete(name)));

        // Marcar tiempo de última limpieza
        localStorage.setItem(CACHE_CLEANUP_KEY, String(now));

        console.log(
          "🧹 Cache limpiado automáticamente en background (cada 24h)"
        );
      } catch (error) {
        console.error("Error in PWA cache cleanup:", error);
      }
    };

    // Ejecutar limpieza silenciosamente en background
    cleanupCache();

    // Opcionalmente: programar limpieza cada 24h mientras app está abierta
    const interval = setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
