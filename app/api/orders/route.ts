import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generarNumeroTicket } from '@/lib/ticket-generator'

// GET órdenes del usuario o una específica
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ordenId = searchParams.get('id')
    const usuarioId = searchParams.get('usuarioId')

    if (ordenId) {
      const orden = await prisma.orden.findUnique({
        where: { id: parseInt(ordenId) },
        include: {
          usuario: {
            select: {
              id: true,
              correo: true,
              nombre: true,
              apellido: true,
            },
          },
          metodoPago: true,
          items: {
            include: {
              producto: true,
            },
          },
        },
      })

      if (!orden) {
        return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
      }

      return NextResponse.json(orden)
    }

    // Órdenes de un usuario
    if (usuarioId) {
      const ordenes = await prisma.orden.findMany({
        where: { usuarioId: parseInt(usuarioId) },
        include: {
          metodoPago: true,
          items: {
            include: { producto: true },
          },
        },
        orderBy: { creadoEn: 'desc' },
      })

      return NextResponse.json(ordenes)
    }

    // Todas las órdenes (admin)
    const todasLasOrdenes = await prisma.orden.findMany({
      include: {
        usuario: {
          select: { correo: true, nombre: true, apellido: true },
        },
        metodoPago: true,
      },
      orderBy: { creadoEn: 'desc' },
    })

    return NextResponse.json(todasLasOrdenes)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST crear orden (con items)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { usuarioId, metodoPagoId, items, notas } = body

    if (!usuarioId || !metodoPagoId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'usuarioId, metodoPagoId, items[] son requeridos' },
        { status: 400 }
      )
    }

    // Verificar usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    })
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar método de pago existe
    const metodoPago = await prisma.metodoPagoCatalogo.findUnique({
      where: { id: metodoPagoId },
    })
    if (!metodoPago) {
      return NextResponse.json(
        { error: 'Método de pago no existe' },
        { status: 404 }
      )
    }

    // Procesar items y calcular total
    let montoTotal = 0
    const itemsOrdenData: { productoId: number; cantidad: number; precioEn: number }[] = []

    for (const item of items) {
      // Aceptar tanto productId como productoId
      const productId = item.productId || item.productoId
      
      if (!productId || !item.cantidad || !item.precio) {
        return NextResponse.json(
          { error: 'Cada item debe tener productId, cantidad y precio' },
          { status: 400 }
        )
      }

      const producto = await prisma.producto.findUnique({
        where: { id: productId },
      })

      if (!producto) {
        return NextResponse.json(
          { error: `Producto ${productId} no encontrado` },
          { status: 404 }
        )
      }

      if (producto.stock < item.cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${producto.nombre}` },
          { status: 400 }
        )
      }

      montoTotal += item.precio * item.cantidad
      itemsOrdenData.push({
        productoId: productId,
        cantidad: item.cantidad,
        precioEn: item.precio,
      })
    }

    // Generar número de ticket
    const numeroTicket = await generarNumeroTicket()

    // Crear orden con items Y actualizar stock (en una transacción)
    const orden = await prisma.$transaction(async (tx) => {
      // Crear la orden
      const newOrden = await tx.orden.create({
        data: {
          numeroTicket,
          usuarioId,
          metodoPagoId,
          montoTotal,
          notas: notas || undefined,
          items: {
            create: itemsOrdenData.map(item => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              precioEn: item.precioEn,
            })),
          },
        },
        include: {
          items: {
            include: { producto: true },
          },
          metodoPago: true,
          estatus: true,
          usuario: true,
        },
      })

      // Decrementar stock de cada producto
      for (const item of itemsOrdenData) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: {
            stock: {
              decrement: item.cantidad,
            },
          },
        })
      }

      return newOrden
    })

    return NextResponse.json(orden, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
