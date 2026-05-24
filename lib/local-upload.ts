import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { uploadToFTP, deleteFromFTP } from './ftp-service'

/**
 * URL base del VPS para imágenes
 */
const FTP_BASE_URL = process.env.FTP_BASE_URL || 'https://fiora.mascontrol.app/uploads/products'

/**
 * Sube una imagen desde base64 al VPS via FTP
 * Estructura remota: /fiora.mascontrol.app/uploads/products/{CODIGO-PRODUCTO}/imagen_{numero}.jpg
 * @param base64Data - Datos base64 de la imagen
 * @param codigoProducto - Código del producto
 * @param numeroImagen - Número de imagen (para nombrar el archivo)
 * @returns Objeto con url e información
 */
export async function uploadImageLocal(
  base64Data: string,
  codigoProducto: string,
  numeroImagen: number
) {
  try {
    // Validar formato base64
    const matches = base64Data.match(/data:image\/(\w+);base64,(.+)/)
    if (!matches) {
      throw new Error('Formato de imagen inválido')
    }

    const [, fileType, base64String] = matches
    const ext = fileType.toLowerCase() === 'jpeg' ? 'jpg' : fileType.toLowerCase()

    // Convertir base64 a buffer
    const imageBuffer = Buffer.from(base64String, 'base64')

    // Ruta remota en FTP
    const remotePath = `${codigoProducto}/imagen_${numeroImagen}.${ext}`
    const filename = `imagen_${numeroImagen}.${ext}`

    // Subir a FTP
    const url = await uploadToFTP(remotePath, imageBuffer)

    console.log(`✓ Imagen subida a VPS: ${url}`)

    return {
      url,
      nombreArchivo: filename,
      tamano: imageBuffer.length,
      tipo: `image/${ext}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al guardar imagen'
    console.error('❌ Error uploading image to VPS:', message)
    throw new Error(`Error al guardar imagen en VPS: ${message}`)
  }
}

/**
 * Reorganiza imágenes después de eliminar una
 * Elimina el archivo del VPS y reorganiza índices
 * @param codigoProducto - Código del producto
 * @param imagenAEliminar - Número de imagen a eliminar (0-based)
 * @returns Array de archivos que quedan después de reorganizar
 */
export async function reorganizeImages(codigoProducto: string, imagenAEliminar: number) {
  try {
    console.log(`ℹ Reorganizando imágenes del producto ${codigoProducto}, eliminando índice ${imagenAEliminar}`)
    
    // Eliminar la imagen del VPS (búsqueda por índice: imagen_0, imagen_1, etc)
    const extensiones = ['jpg', 'png', 'jpeg', 'webp']
    let eliminada = false
    
    for (const ext of extensiones) {
      const filename = `imagen_${imagenAEliminar}.${ext}`
      const remotePath = `${codigoProducto}/${filename}`
      
      try {
        await deleteFromFTP(remotePath)
        eliminada = true
        console.log(`✓ Imagen eliminada del VPS: ${remotePath}`)
        break // Solo una extensión será correcta
      } catch (e) {
        // Intentar siguiente extensión
        continue
      }
    }
    
    if (!eliminada) {
      console.warn(`⚠ No se encontró imagen_${imagenAEliminar} en VPS (puede estar ya eliminada)`)
    }
    
    console.log(`✓ Imágenes reorganizadas para producto ${codigoProducto}`)
    return []
  } catch (error) {
    console.error('❌ Error reorganizando imágenes:', error)
    throw error
  }
}

/**
 * Elimina una imagen del VPS via FTP
 * @param codigoProducto - Código del producto
 * @param filename - Nombre del archivo a eliminar
 */
export async function deleteImageLocal(codigoProducto: string, filename: string) {
  try {
    // Validar nombre de archivo
    if (!filename.match(/^imagen_\d+\.(jpg|png|jpeg|webp)$/)) {
      throw new Error('Nombre de archivo no válido')
    }

    const remotePath = `${codigoProducto}/${filename}`
    await deleteFromFTP(remotePath)
    console.log(`✓ Imagen eliminada del VPS: ${codigoProducto}/${filename}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar imagen'
    console.error('❌ Error deleting image from VPS:', message)
    // No lanzar error, solo registrar
  }
}

/**
 * Obtiene la ruta pública de una imagen en VPS
 */
export function getImageUrl(codigoProducto: string, filename: string): string {
  return `${FTP_BASE_URL}/${codigoProducto}/${filename}`
}
