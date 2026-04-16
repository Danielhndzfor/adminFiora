"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function PWASettings() {
  const [version, setVersion] = useState<string>("Cargando...");
  const [swStatus, setSWStatus] = useState<string>("Desconocido");
  const [isChecking, setIsChecking] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      // Obtener versión
      const versionResponse = await fetch("/api/version", {
        cache: "no-store",
      });
      const versionData = await versionResponse.json();
      setVersion(versionData.version);

      // Obtener estado del SW
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          setSWStatus("✅ Service Worker Activo");
        } else if (registration.installing) {
          setSWStatus("🔧 Service Worker Instalando...");
        } else if (registration.waiting) {
          setSWStatus("⏳ Service Worker Esperando Activación");
        }
      } else {
        setSWStatus("PWA no disponible");
      }
    } catch (error) {
      console.error("Error loading PWA status:", error);
      setVersion("Error");
      setSWStatus("Error al cargar estado");
    }
  };

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    try {
      if ("serviceWorker" in navigator) {
        toast("🔎 Buscando actualizaciones...");
        const registration = await navigator.serviceWorker.ready;
        await registration.update();

        // Si hay un SW esperando, pedirle que se active inmediatamente
        if (registration.waiting) {
          toast.success("✨ Nueva versión lista", {
            description: "Se descargó una nueva versión. Aplicando ahora...",
          });

          try {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          } catch (e) {
            console.warn("No se pudo enviar SKIP_WAITING al SW:", e);
          }

          // Recargar cuando el controlador cambie (se haya activado la nueva SW)
          const onControllerChange = () => {
            window.location.reload();
          };
          navigator.serviceWorker.addEventListener("controllerchange", onControllerChange, { once: true });
        } else if (registration.installing) {
          toast("🔧 Instalando actualización...", { description: "La nueva versión se está instalando." });
        } else {
          toast.success("✅ No hay actualizaciones disponibles", {
            description: "Ya estás en la versión más reciente.",
          });
        }

        await loadStatus();
      } else {
        toast.error("❌ PWA no disponible en este navegador");
      }
    } catch (error) {
      toast.error("❌ Error al verificar actualizaciones", {
        description: String(error),
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm("¿Seguro que deseas borrar todo el cache? Esta acción no se puede deshacer.")) {
      return;
    }

    setIsClearing(true);
    try {
      // Listar todos los caches
      const cacheNames = await caches.keys();

      // Borrar todos los caches
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      toast.success("🗑️ Cache borrado exitosamente", {
        description: "Todas las páginas se recargarán desde el servidor",
      });

      // Recargar página después de un momento
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error("❌ Error al borrar cache", {
        description: String(error),
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleUnregisterSW = async () => {
    if (!confirm("¿Deseas desinstallar el Service Worker? El PWA dejará de funcionar offline.")) {
      return;
    }

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
        toast.success("✅ Service Worker desinstalado", {
          description: "Recargando aplicación...",
        });
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      toast.error("❌ Error al desinstalador SW", {
        description: String(error),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado del PWA */}
        <Card className="p-6 space-y-3">
          <h3 className="font-semibold text-lg">📱 Estado del PWA</h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Versión:</span>
              <span className="font-mono font-semibold text-sm">{version}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service Worker:</span>
              <span className="text-sm">{swStatus}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cache:</span>
              <span className="text-sm text-green-600">✅ Activo</span>
            </div>
          </div>

          <Button
            onClick={loadStatus}
            variant="outline"
            className="w-full text-sm"
          >
            🔄 Refrescar Estado
          </Button>
        </Card>

        {/* Actualizaciones */}
        <Card className="p-6 space-y-3">
          <h3 className="font-semibold text-lg">✨ Actualizaciones</h3>

          <p className="text-sm text-gray-600">
            Verifica si hay una nueva versión del app disponible.
          </p>

          <Button
            onClick={handleCheckForUpdates}
            disabled={isChecking}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isChecking ? "🔄 Verificando..." : "🔍 Verificar Actualizaciones"}
          </Button>
        </Card>
      </div>

      {/* Gestión de Cache */}
      <Card className="p-6 space-y-3">
        <h3 className="font-semibold text-lg">🗑️ Gestión de Cache</h3>

        <p className="text-sm text-gray-600">
          Si el app se ve extraño o tiene contenido desactualizado, limpia el cache completamente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={handleClearCache}
            disabled={isClearing}
            variant="outline"
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            {isClearing ? "⌛ Borrando..." : "🗑️ Borrar Todo el Cache"}
          </Button>

          <Button
            onClick={handleUnregisterSW}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            ⏹️ Desinstalar Service Worker
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          ⚠️ Advertencia: Estas acciones pueden afectar el rendimiento offline y harán que el app descargue todo nuevamente desde el servidor.
        </p>
      </Card>

      {/* Información */}
      <Card className="p-6 space-y-3 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-lg">ℹ️ Información</h3>

        <ul className="text-sm text-gray-700 space-y-2">
          <li>✅ El cache se actualiza automáticamente cuando desplegamos nuevas versiones</li>
          <li>✅ Los cambios en páginas HTML se aplican en 24 horas o menos</li>
          <li>✅ Los cambios en APIs se aplican dentro de 5 minutos</li>
          <li>✅ El app sigue funcionando offline con datos guardados en cache</li>
        </ul>
      </Card>
    </div>
  );
}
