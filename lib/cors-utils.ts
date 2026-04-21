/**
 * CORS Headers utilities for public API endpoints
 * Centraliza la configuración de CORS para producción y desarrollo
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Cambiar a dominio específico en producción: process.env.NEXT_PUBLIC_API_DOMAIN
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export const cacheHeaders = {
  public: "public, s-maxage=3600, stale-while-revalidate=86400",
  short: "public, s-maxage=60, stale-while-revalidate=120",
  detail: "public, s-maxage=300, stale-while-revalidate=600",
}

/**
 * Retorna headers CORS seguros
 * En producción, usa variable de entorno para dominio permitido
 */
export function getCorsHeaders(cacheType: "public" | "short" | "detail" = "public") {
  const allowOrigin = process.env.CORS_ALLOWED_ORIGINS || "*"
  
  return {
    "Cache-Control": cacheHeaders[cacheType],
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}
