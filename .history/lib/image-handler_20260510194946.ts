/**
 * Manejador de imágenes para el nuevo sistema (servidor local)
 * Soporta array de hasta 5 imágenes por producto
 */

import prisma from '@/lib/prisma'
import type { Producto, Prisma } from '@prisma/client'

export interface ProductoImagen {
  url: string
  nombreArchivo: string
  orden: number
  creadoEn: string
}

/**
 * Parsea el JSON de imágenes de la BD
 */
export const parseImagenesJSON = (imagenes: string | null | undefined): ProductoImagen[] => {
  if (!imagenes) return []
  try {
    const parsed = JSON.parse(imagenes)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    console.error('Error parseando JSON de imágenes:', imagenes)
    return []
  }
}

/**
 * Convierte array de imágenes a JSON string
 */
export const stringifyImagenes = (imagenes: ProductoImagen[]): string => {
  return JSON.stringify(imagenes)
}

/**
 * Obtiene la imagen principal (primera del array)
 */
export const getPrincipalImagen = (imagenes: string | null | undefined): ProductoImagen | null => {
  const parsed = parseImagenesJSON(imagenes)
  return parsed.length > 0 ? parsed[0] : null
}

/**
 * Añade una nueva imagen al array (máximo 5)
 */
export const addImagen = (
  imagenesJSON: string | null | undefined,
  nuevaImagen: Omit<ProductoImagen, 'orden' | 'creadoEn'>
): string => {
  const imagenes = parseImagenesJSON(imagenesJSON)
  
  // Si ya hay 5, no añadir más
  if (imagenes.length >= 5) {
    throw new Error('Máximo 5 imágenes por producto')
  }

  // Calcular próximo orden
  const nuevoOrden = Math.max(...imagenes.map(i => i.orden), 0) + 1

  imagenes.push({
    ...nuevaImagen,
    orden: nuevoOrden,
    creadoEn: new Date().toISOString(),
  })

  return stringifyImagenes(imagenes)
}

/**
 * Elimina una imagen del array por índice (orden)
 */
export const removeImagen = (
  imagenesJSON: string | null | undefined,
  orden: number
): string => {
  const imagenes = parseImagenesJSON(imagenesJSON)
  const filtered = imagenes.filter(i => i.orden !== orden)
  return stringifyImagenes(filtered)
}

/**
 * Reordena imágenes
 */
export const reorderImagenes = (
  imagenesJSON: string | null | undefined,
  orden: number[]
): string => {
  const imagenes = parseImagenesJSON(imagenesJSON)
  
  // Validar que todos los órdenes existen
  const imagenesMap = new Map(imagenes.map(i => [i.orden, i]))
  const reordenadas = orden
    .map(o => imagenesMap.get(o))
    .filter((img): img is ProductoImagen => img !== undefined)
    .map((img, idx) => ({ ...img, orden: idx + 1 }))

  return stringifyImagenes(reordenadas)
}

/**
 * Actualiza una imagen específica
 */
export const updateImagen = (
  imagenesJSON: string | null | undefined,
  orden: number,
  updates: Partial<Omit<ProductoImagen, 'orden' | 'creadoEn'>>
): string => {
  const imagenes = parseImagenesJSON(imagenesJSON)
  const idx = imagenes.findIndex(i => i.orden === orden)

  if (idx === -1) {
    throw new Error(`Imagen con orden ${orden} no encontrada`)
  }

  imagenes[idx] = { ...imagenes[idx], ...updates }
  return stringifyImagenes(imagenes)
}

/**
 * Obtiene producto con imágenes parseadas
 */
export const getProductoConImagenes = async (
  productoId: number
): Promise<(Producto & { imagenesArray: ProductoImagen[] }) | null> => {
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
): Promise<(Producto & { imagenesArray: ProductoImagen[] })[]> => {
  const productos: Producto[] = await prisma.producto.findMany({ where })
  return productos.map((p: Producto) => ({
    ...p,
    imagenesArray: parseImagenesJSON(p.imagenes as string | null | undefined),
  }))
}
