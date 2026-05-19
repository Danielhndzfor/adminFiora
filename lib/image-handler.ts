/**
 * Manejador de imágenes - Funciones SERVER-ONLY
 * Las funciones client-safe están en image-handler-client.ts
 */

import prisma from '@/lib/prisma'
import type { Producto, Prisma } from '@prisma/client'
import { parseImagenesJSON, type ProductoImagen } from './image-handler-client'

// Re-export types para uso en server code
export type { ProductoImagen }

/**
 * Obtiene producto con imágenes parseadas
 */
export const getProductoConImagenes = async (
  productoId: number
): Promise<(Producto & { imagenesArray: { url: string; nombreArchivo: string; orden: number; creadoEn: string }[] }) | null> => {
  const producto = await prisma.producto.findUnique({
    where: { id: productoId },
  })

  if (!producto) return null

  return {
    ...producto,
    imagenesArray: parseImagenesJSON(producto.imagenes as string | null | undefined),
  }
}

/**
 * Lista productos con imágenes parseadas
 */
export const listProductosConImagenes = async (
  where?: Prisma.ProductoWhereInput
): Promise<(Producto & { imagenesArray: { url: string; nombreArchivo: string; orden: number; creadoEn: string }[] })[]> => {
  const productos: Producto[] = await prisma.producto.findMany({ where })
  return productos.map((p: Producto) => ({
    ...p,
    imagenesArray: parseImagenesJSON(p.imagenes as string | null | undefined),
  }))
}
