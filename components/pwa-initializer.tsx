"use client";

import { useEffect } from "react";
import { usePWAUpdate } from "@/hooks/use-pwa-update";
import { useAuthErrorHandler } from "@/hooks/use-auth-error-handler";
import { usePWACacheCleaner } from "@/hooks/use-pwa-cache-cleaner";

export function PWAInitializer() {
  usePWAUpdate();
  useAuthErrorHandler();
  usePWACacheCleaner();

  useEffect(() => {
    // Registrar manejo de cambios offline/online
    const handleOnline = () => {
      console.log("📡 Conectado nuevamente");
    };

    const handleOffline = () => {
      console.log("📴 Sin conexión");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
