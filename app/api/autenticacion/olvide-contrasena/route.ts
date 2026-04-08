import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generarTokenAleatorio, esEmailValido } from '@/lib/seguridad'

/**
 * POST /api/autenticacion/olvide-contrasena
 * Genera un token para restablecimiento de contraseña
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { correo } = body

    if (!correo || !esEmailValido(correo)) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { correo },
    })

    // Por seguridad, siempre responder positivo (evita enumeración de usuarios)
    if (!usuario) {
      return NextResponse.json(
        {
          mensaje: 'Si existe una cuenta con este correo, recibirás un enlace para restablecerla',
        },
        { status: 200 }
      )
    }

    // Generar token
    const token = generarTokenAleatorio()
    const expiracion = new Date(Date.now() + 1000 * 60 * 60) // 1 hora

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tokenRestablecimiento: token,
        tokenRestablecimientoEn: expiracion,
      },
    })

    // TODO: Enviar email con el token
    console.log(`Token de restablecimiento: ${token}`)
    console.log(`Enlace: ${process.env.NEXT_PUBLIC_APP_URL}/restablecimiento?token=${token}`)

    return NextResponse.json(
      {
        mensaje: 'Si existe una cuenta con este correo, recibirás un enlace para restablecerla',
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error en olvide contraseña:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
