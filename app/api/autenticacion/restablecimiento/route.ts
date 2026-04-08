import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashearContrasena, esContraseñaSegura } from '@/lib/seguridad'

/**
 * POST /api/autenticacion/restablecimiento
 * Restablece la contraseña con token válido
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, contrasenaNueva } = body

    if (!token || !contrasenaNueva) {
      return NextResponse.json(
        { error: 'token y contrasenaNueva son requeridos' },
        { status: 400 }
      )
    }

    const { valida, errores } = esContraseñaSegura(contrasenaNueva)
    if (!valida) {
      return NextResponse.json(
        { error: 'Contraseña débil', detalles: errores },
        { status: 400 }
      )
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        tokenRestablecimiento: token,
        tokenRestablecimientoEn: {
          gt: new Date(), // Token no expirado
        },
      },
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      )
    }

    const contrasenaiHash = await hashearContrasena(contrasenaNueva)

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        contrasena: contrasenaiHash,
        tokenRestablecimiento: null,
        tokenRestablecimientoEn: null,
      },
    })

    return NextResponse.json(
      { mensaje: 'Contraseña restablecida exitosamente' },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error en restablecimiento:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
