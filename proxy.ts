import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/iniciar-sesion', '/registro', '/olvide-contrasena', '/restablecimiento']

export function proxy(request: NextRequest) {
    // No usar `localStorage` en proxy (se ejecuta en servidor).
    // Preferir cookie `token` y como fallback el header Authorization.
    const token =
        request.cookies.get('token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '') ||
        null
    const { pathname } = request.nextUrl

    // Si está en la página raíz
    if (pathname === '/') {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
            return NextResponse.redirect(new URL('/iniciar-sesion', request.url))
        }
    }

    // Proteger rutas privadas
    if (!publicRoutes.includes(pathname) && !token) {
        return NextResponse.redirect(new URL('/iniciar-sesion', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/dashboard', '/admin', '/ventas', '/historial', '/inventario'],
}
