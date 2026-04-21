/**
 * CORS Headers utilities for public API endpoints
 * Centraliza la configuración de CORS para producción y desarrollo
 */

import { NextResponse } from "next/server"

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

/**
 * Wrapper para respuestas JSON que garantiza CORS headers
 * Úsalo para envolver NextResponse.json() en tus endpoints
 */
export function corsJsonResponse(
  data: any,
  status: number = 200,
  cacheType: "public" | "short" | "detail" = "public"
) {
  return NextResponse.json(data, {
    status,
    headers: getCorsHeaders(cacheType),
  })
}

/**
 * Wrapper para respuestas de error con CORS
 */
export function corsErrorResponse(
  message: string,
  status: number = 500,
  cacheType: "public" | "short" | "detail" = "public"
) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: getCorsHeaders(cacheType),
    }
  )
}
