import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashearContrasena, esEmailValido, esContraseñaSegura } from '@/lib/seguridad'

// GET all users (admin only) / GET self
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get('id')

    if (usuarioId) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(usuarioId) },
        select: {
          id: true,
          correo: true,
          nombre: true,
          apellido: true,
          telefono: true,
          direccion: true,
          ciudad: true,
          estado: true,
          codigoPostal: true,
          pais: true,
          rol: true,
          creadoEn: true,
          actualizadoEn: true,
        },
      })

      if (!usuario) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }

      return NextResponse.json(usuario)
    }

    // Listar todos (solo admin en producción)
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
    })

    return NextResponse.json(usuarios)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST crear usuario (registro)
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
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const validacionContrasena = esContraseñaSegura(contrasena)
    if (!validacionContrasena.valida) {
      return NextResponse.json(
        { error: 'Contraseña inválida', detalles: validacionContrasena.errores },
        { status: 400 }
      )
    }

    // Verificar email no existe
    const usuarioExistente = await prisma.usuario.findUnique({ where: { correo } })
    if (usuarioExistente) {
      return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 })
    }

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        correo,
        contrasena: await hashearContrasena(contrasena),
        nombre,
        apellido,
        telefono: telefono || undefined,
      },
      select: {
        id: true,
        correo: true,
        nombre: true,
        apellido: true,
        creadoEn: true,
      },
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
