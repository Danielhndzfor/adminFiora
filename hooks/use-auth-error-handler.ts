"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useAuthErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    // Interceptar fetch globalmente
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const [resource, config] = args;

      try {
        const response = await originalFetch(...args);

        // Manejar 401 - Token expirado/inválido
        if (response.status === 401) {
          console.warn("🚨 Token expirado - redirigiendo a login");

          // Limpiar token del localStorage
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");

          // Mostrar notificación
          toast.error("⏳ Tu sesión ha expirado", {
            description: "Por favor inicia sesión de nuevo",
          });

          // Redirigir a login después de un pequeño delay
          setTimeout(() => {
            router.push("/iniciar-sesion");
          }, 500);
        }

        // Manejar 403 - Acceso denegado
        if (response.status === 403) {
          console.warn("🚫 Acceso denegado");
          toast.error("❌ No tienes permisos para esto", {
            description: "Contacta al administrador",
          });
        }

        return response;
      } catch (error) {
        // Si es error de red en offline mode
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          console.warn("📡 Sin conexión");
        }
        throw error;
      }
    };

    return () => {
      // Restaurar fetch original al desmontar
      window.fetch = originalFetch;
    };
  }, [router]);
}
