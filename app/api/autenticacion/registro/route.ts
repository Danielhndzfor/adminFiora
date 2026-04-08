import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  hashearContrasena,
  verificarContrasena,
  generarTokenJWT,
  esEmailValido,
  esContraseñaSegura,
} from '@/lib/seguridad'

/**
 * POST /api/autenticacion/registro
 * Registra un nuevo usuario
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { correo, contrasena, nombre, apellido, telefono } = body

    // Validaciones
    if (!correo || !contrasena || !nombre || !apellido) {
      return NextResponse.json(
        { error: 'correo, contrasena, nombre, apellido son requeridos' },
        { status: 400 }
      )
    }

    if (!esEmailValido(correo)) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 })
    }

    const { valida, errores } = esContraseñaSegura(contrasena)
    if (!valida) {
      return NextResponse.json(
        { error: 'Contraseña débil', detalles: errores },
        { status: 400 }
      )
    }

    // Verificar que el correo no exista
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo },
    })
    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado' },
        { status: 409 }
      )
    }

    // Crear usuario
    const contrasenaiHash = await hashearContrasena(contrasena)
    const usuario = await prisma.usuario.create({
      data: {
        correo,
        contrasena: contrasenaiHash,
        nombre,
        apellido,
        telefono: telefono || undefined,
        rolId: 3, // CLIENTE por defecto
      },
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        creadoEn: true,
      },
    })

    // Generar token JWT
    const token = generarTokenJWT(usuario.id, usuario.correo)

    return NextResponse.json(
      {
        mensaje: 'Usuario registrado exitosamente',
        usuario,
        token,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Error en registro:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
