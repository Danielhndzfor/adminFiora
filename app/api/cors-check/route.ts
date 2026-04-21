import { NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders } from '@/lib/cors-utils'

/**
 * GET /api/cors-check
 * 
 * Endpoint de diagnóstico para verificar que CORS está configurado correctamente
 * Devuelve los headers CORS que se están enviando
 */
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin') || 'sin-origin'
  const userAgent = req.headers.get('user-agent') || 'sin-user-agent'

  return NextResponse.json(
    {
      status: 'CORS configurado correctamente ✓',
      timestamp: new Date().toISOString(),
      request: {
        origin,
        userAgent,
        method: 'GET',
        path: '/api/cors-check',
      },
      corsHeaders: getCorsHeaders(),
      info: 'Si ves este mensaje, CORS está funcionando correctamente. El navegador puede realizar peticiones cruzadas.',
    },
    {
      status: 200,
      headers: getCorsHeaders('short'),
    }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}
