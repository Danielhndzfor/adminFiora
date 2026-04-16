"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function usePWAUpdate() {
  const updateCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastVersionRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let registration: ServiceWorkerRegistration | null = null;

    const checkForUpdates = async () => {
      try {
        // Obtener versión actual del servidor
        const response = await fetch("/api/version", {
          cache: "no-store",
          headers: {
            "pragma": "no-cache",
            "cache-control": "no-cache",
          },
        });

        if (!response.ok) return;

        const { version } = await response.json();

        // Si es la primera vez, guardar versión
        if (!lastVersionRef.current) {
          lastVersionRef.current = version;
          return;
        }

        // Si hay actualización disponible
        if (version !== lastVersionRef.current) {
          lastVersionRef.current = version;

          // Notificar al service worker para actualizar
          if (registration?.waiting) {
            console.log("🔄 Actualización de PWA disponible");

            const toastId = toast.success("✨ Nueva versión disponible", {
              description: "Recarga la app para aplicar cambios",
              duration: 0,
              action: {
                label: "Actualizar",
                onClick: () => {
                  // Enviar mensaje al SW en espera para activarse
                  const waitingSW = registration!.waiting;
                  if (waitingSW) {
                    waitingSW.postMessage({ type: "SKIP_WAITING" });

                    // Recargar página después de que el nuevo SW se active
                    waitingSW.addEventListener("statechange", () => {
                      if (waitingSW.state === "activated") {
                        window.location.reload();
                      }
                    });
                  }
                },
              },
            });
          } else if (registration?.installing) {
            console.log("🔧 SW instalando nueva versión...");
          }
        }
      } catch (error) {
        console.error("Error checking for PWA updates:", error);
      }
    };

    const initPWAUpdate = async () => {
      try {
        // Registrar escucha para nuevas versiones
        if ("serviceWorker" in navigator) {
          registration = await navigator.serviceWorker.ready;

          // Chequear updates inmediatamente
          await checkForUpdates();

          // Chequear cada 1 hora
          updateCheckRef.current = setInterval(checkForUpdates, 60 * 60 * 1000);

          // Escuchar cuando se instale nueva versión
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            console.log("✅ Service Worker actualizado");
          });

          // También chequear cuando vuelve online
          window.addEventListener("online", () => {
            checkForUpdates();
          });
        }
      } catch (error) {
        console.error("Error initializing PWA update check:", error);
      }
    };

    // Esperar un poco para que se conecte el SW
    const timeout = setTimeout(initPWAUpdate, 500);

    return () => {
      clearTimeout(timeout);
      if (updateCheckRef.current) {
        clearInterval(updateCheckRef.current);
      }
    };
  }, []);
}
