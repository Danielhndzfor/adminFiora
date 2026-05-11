/**
 * CORS Headers utilities for public API endpoints
 * Centraliza la configuración de CORS para producción y desarrollo
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
}

export const cacheHeaders = {
  public: "public, s-maxage=3600, stale-while-revalidate=86400",
  short: "public, s-maxage=60, stale-while-revalidate=120",
  detail: "public, s-maxage=300, stale-while-revalidate=600",
}

/**
 * Retorna headers CORS seguros para autenticación con cookies httpOnly
 * Soporta tanto solicitudes públicas como autenticadas
 */
export function getCorsHeaders(cacheType: "public" | "short" | "detail" = "public") {
  const allowOrigin = process.env.CORS_ALLOWED_ORIGINS || "http://localhost:3000"
  
  return {
    "Cache-Control": cacheType === "public" ? cacheHeaders[cacheType] : cacheHeaders[cacheType],
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  }
}
