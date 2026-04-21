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

    // CORS: sólo para llamadas a /api/*
    if (pathname.startsWith('/api/')) {
        const allowOriginEnv = (process.env.CORS_ALLOWED_ORIGINS || '*').trim()
        const requestOrigin = request.headers.get('origin') || ''

        let allowOrigin = allowOriginEnv
        if (allowOriginEnv === '*' && requestOrigin) {
            allowOrigin = requestOrigin
        } else if (allowOriginEnv !== '*' && requestOrigin) {
            // allowOriginEnv can be a comma-separated list
            const allowed = allowOriginEnv.split(',').map(s => s.trim())
            if (allowed.includes(requestOrigin)) allowOrigin = requestOrigin
        }

        const allowMethods = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
        const allowHeaders = 'Content-Type, Authorization'
        const allowCredentials = 'true'

        const corsHeaders = {
            'Access-Control-Allow-Origin': allowOrigin,
            'Access-Control-Allow-Methods': allowMethods,
            'Access-Control-Allow-Headers': allowHeaders,
            'Access-Control-Allow-Credentials': allowCredentials,
            'Vary': 'Origin',
        }

        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 204,
                headers: corsHeaders,
            })
        }

        const res = NextResponse.next()
        // Aplicar cabeceras CORS a la respuesta
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))

        return res
    }

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
    matcher: ['/', '/dashboard', '/admin', '/ventas', '/historial', '/inventario', '/api/:path*'],
}
