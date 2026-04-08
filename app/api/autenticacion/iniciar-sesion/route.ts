import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verificarContrasena, generarTokenJWT, esEmailValido } from '@/lib/seguridad'

/**
 * POST /api/autenticacion/iniciar-sesion
 * Inicia sesión y devuelve JWT
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { correo, contrasena } = body

    if (!correo || !contrasena) {
      return NextResponse.json(
        { error: 'correo y contrasena son requeridos' },
        { status: 400 }
      )
    }

    if (!esEmailValido(correo)) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 })
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { correo },
      include: {
        rol: true,
      },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Correo o contraseña incorrectos' },
        { status: 401 }
      )
    }

    if (!usuario.activo) {
      return NextResponse.json(
        { error: 'Esta cuenta ha sido desactivada' },
        { status: 403 }
      )
    }

    // Verificar contraseña
    const contrasenaCorrecto = await verificarContrasena(contrasena, usuario.contrasena)
    if (!contrasenaCorrecto) {
      return NextResponse.json(
        { error: 'Correo o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Actualizar último acceso y traer el registro actualizado
    let usuarioActualizado = null
    try {
      usuarioActualizado = await prisma.usuario.update({
        where: { id: usuario.id },
        data: { ultimoAcceso: new Date() },
      })
    } catch (err) {
      console.error('Error actualizando ultimoAcceso:', err)
      // continuar; no queremos bloquear el inicio de sesión por un fallo menor
    }

    // Generar token JWT con expiración en 24 horas y devolverlo en cookie HTTP-only
    const token = generarTokenJWT(usuario.id, usuario.correo, '24h')

    const responseBody = {
      mensaje: 'Sesión iniciada',
      usuario: usuarioActualizado
        ? {
            id: usuarioActualizado.id,
            correo: usuarioActualizado.correo,
            nombre: usuarioActualizado.nombre,
            apellido: usuarioActualizado.apellido,
            rol: usuario.rol.nombre,
            ultimoAcceso: usuarioActualizado.ultimoAcceso,
          }
        : {
            id: usuario.id,
            correo: usuario.correo,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rol: usuario.rol.nombre,
          },
      token,
    }

    const res = NextResponse.json(responseBody, { status: 200 })
    res.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return res
  } catch (err) {
    console.error('Error en iniciar sesión:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
