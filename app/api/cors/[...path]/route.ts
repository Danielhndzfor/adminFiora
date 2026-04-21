import { NextRequest, NextResponse } from 'next/server'

/**
 * Maneja preflight CORS requests para todos los endpoints públicos
 * Ruta: /api/cors/[...path]
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/api\/cors/, '')
  
  // Redirigir a la ruta real con CORS headers
  const realUrl = new URL(`http://${request.headers.get('host')}/api${path}${request.nextUrl.search}`)
  
  try {
    const response = await fetch(realUrl.toString())
    const data = await response.json()
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error forwarding request' },
      { status: 500 }
    )
  }
}
