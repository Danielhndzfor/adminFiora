import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * Estados esperados en BD:
 * 1 = Pagado (venta completada, stock restado)
 * 2 = Pendiente (reservado, stock restado temporalmente)
 * 3 = Cancelado (deshecho, stock devuelto)
 */

interface UpdateStatusPayload {
    idEstatus: number
    razon?: string
}

interface StockAdjustment {
    productoId: number
    cantidad: number
    ordenId: number
}

/**
 * Calcula el delta de stock necesario según la transición de estado
 * Retorna array de ajustes a realizar (+ = devolver, - = restar)
 */
async function calculateStockAdjustment(
    ordenId: number,
    estatusAnterior: number,
    estatusNuevo: number
): Promise<StockAdjustment[]> {
    // Obtener items de la orden
    const items = await prisma.itemOrden.findMany({
        where: { ordenId },
        select: { productoId: true, cantidad: true },
    })

    // Lógica de transición de stock
    const transitions: Record<string, number> = {
        // Formato: "anterior-nuevo": delta
        // Positive = devolver stock (incremento)
        // Negative = restar stock (decremento)

        // Cancelado (3) → cualquier otro: -cantidad (restar, porque estaba devuelto)
        '3-1': -1, // Cancelado → Pagado (restar, nueva venta)
        '3-2': -1, // Cancelado → Pendiente (restar, reservar)

        // Pendiente (2) → otro: sin cambio (ya estaba restado en reserva)
        '2-1': 0, // Pendiente → Pagado (sin cambio, completar venta)
        '2-3': 1, // Pendiente → Cancelado (devolver, cancelar reserva)

        // Pagado (1) → otro: +cantidad (devolver, porque ya fue vendido)
        '1-2': 1, // Pagado → Pendiente (devolver primero)
        '1-3': 1, // Pagado → Cancelado (devolver venta)
    }

    const key = `${estatusAnterior}-${estatusNuevo}`
    const multiplier = transitions[key]

    if (multiplier === undefined) {
        throw new Error(`Transición de estado no válida: ${key}`)
    }

    return items.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad * multiplier,
        ordenId,
    }))
}

/**
 * Valida que hay suficiente stock disponible
 */
async function validateStockAvailable(adjustments: StockAdjustment[]): Promise<void> {
    for (const adj of adjustments) {
        if (adj.cantidad < 0) {
            // Si se va a restar stock, validar que hay
            const producto = await prisma.producto.findUnique({
                where: { id: adj.productoId },
                select: { stock: true, nombre: true },
            })

            if (!producto) {
                throw new Error(`Producto ${adj.productoId} no encontrado`)
            }

            if (producto.stock + adj.cantidad < 0) {
                throw new Error(
                    `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, Necesario: ${Math.abs(adj.cantidad)}`
                )
            }
        }
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body: UpdateStatusPayload = await request.json()
        const { idEstatus, razon } = body

        if (!idEstatus || typeof idEstatus !== 'number') {
            return Response.json(
                { error: 'idEstatus requerido y debe ser número', code: 'INVALID_ESTATUS' },
                { status: 400 }
            )
        }

        // Usar transacción para garantizar consistencia
        const result = await prisma.$transaction(
            async (tx) => {
                // 1. Obtener orden actual
                const orden = await tx.orden.findUnique({
                    where: { id: parseInt(id) },
                    select: { id: true, idEstatus: true, items: { select: { cantidad: true, productoId: true } } },
                })

                if (!orden) {
                    throw new Error('Orden no encontrada')
                }

                if (orden.idEstatus === idEstatus) {
                    throw new Error('El estado es el mismo, no hay cambios')
                }

                // 2. Calcular ajustes de stock necesarios
                const adjustments = await calculateStockAdjustment(
                    orden.id,
                    orden.idEstatus,
                    idEstatus
                )

                // 3. Validar stock disponible
                await validateStockAvailable(adjustments)

                // 4. Aplicar ajustes de stock
                for (const adj of adjustments) {
                    await tx.producto.update({
                        where: { id: adj.productoId },
                        data: { stock: { increment: adj.cantidad } },
                    })
                }

                // 5. Registrar cambio en auditoría
                await tx.cambioEstatusOrden.create({
                    data: {
                        ordenId: orden.id,
                        estatusAnterior: orden.idEstatus,
                        estatusNuevo: idEstatus,
                        razon: razon || null,
                    },
                })

                // 6. Actualizar estado de la orden
                const updatedOrden = await tx.orden.update({
                    where: { id: orden.id },
                    data: { idEstatus },
                    include: {
                        estatus: true,
                        items: {
                            include: { producto: { select: { nombre: true, stock: true } } },
                        },
                    },
                })

                return { success: true, orden: updatedOrden, adjustments }
            },
            {
                // Timeout de 10 segundos para transacciones largas
                timeout: 10000,
            }
        )

        return Response.json(result, { status: 200 })
    } catch (error) {
        const message = (error as any).message || 'Error desconocido'

        // Errores esperados
        if (
            message.includes('Stock insuficiente') ||
            message.includes('Transición de estado no válida') ||
            message.includes('El estado es el mismo') ||
            message.includes('Orden no encontrada')
        ) {
            return Response.json(
                { error: message, code: 'VALIDATION_ERROR' },
                { status: 400 }
            )
        }

        // Error de transacción o BD
        console.error('Error en actualización de estado:', error)
        return Response.json(
            {
                error: 'Error al actualizar estado de la orden. La transacción fue revertida.',
                code: 'TRANSACTION_FAILED',
                details: message,
            },
            { status: 500 }
        )
    }
}
