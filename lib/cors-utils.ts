/**
 * CORS Headers utilities for public API endpoints
 * Centraliza la configuración de CORS para producción y desarrollo
 * Soporta múltiples orígenes separados por comas
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Vary": "Origin",
}

export const cacheHeaders = {
  public: "public, s-maxage=3600, stale-while-revalidate=86400",
  short: "public, s-maxage=60, stale-while-revalidate=120",
  detail: "public, s-maxage=300, stale-while-revalidate=600",
}

/**
 * Retorna headers CORS seguros para autenticación con cookies httpOnly
 * Soporta tanto solicitudes públicas como autenticadas
 * Valida múltiples orígenes permitidos
 */
export function getCorsHeaders(
  cacheType: "public" | "short" | "detail" = "public",
  requestOrigin?: string
) {
  const allowOriginEnv = (process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000").trim()
  let allowOrigin = allowOriginEnv

  // Si se pasa el origen del request, validar contra la lista de orígenes permitidos
  if (requestOrigin && allowOriginEnv !== "*") {
    const allowed = allowOriginEnv.split(",").map((s) => s.trim())
    allowOrigin = allowed.includes(requestOrigin) ? requestOrigin : allowed[0]
  }

  return {
    "Cache-Control":
      cacheType === "public"
        ? cacheHeaders[cacheType]
        : cacheHeaders[cacheType],
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  }
}
