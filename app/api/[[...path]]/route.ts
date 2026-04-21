import { NextRequest, NextResponse } from 'next/server'

/**
 * Catch-all route handler para /api/* requests
 * Maneja CORS preflight requests y agrega headers CORS a todas las respuestas
 */

export async function OPTIONS() {
  return corsResponse()
}

function corsResponse(body: any = null, status: number = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }

  return new NextResponse(body, {
    status,
    headers,
  })
}
