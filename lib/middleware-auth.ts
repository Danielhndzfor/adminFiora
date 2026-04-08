import { NextRequest, NextResponse } from 'next/server'
import { verificarTokenJWT } from '@/lib/seguridad'

/**
 * Middleware para verificar JWT en rutas protegidas
 */
export function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json(
      { error: 'Token no proporcionado' },
      { status: 401 }
    )
  }

  const decoded = verificarTokenJWT(token)
  if (!decoded) {
    return NextResponse.json(
      { error: 'Token inválido o expirado' },
      { status: 401 }
    )
  }

  // Agregar usuario decodificado al request
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('usuarioId', decoded.usuarioId)
  requestHeaders.set('correo', decoded.correo)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

/**
 * Extrae el usuarioId del token en rutas protegidas
 */
export function obtenerUsuarioDelToken(headers: Headers): number | null {
  const usuarioId = headers.get('usuarioId')
  return usuarioId ? parseInt(usuarioId) : null
}
