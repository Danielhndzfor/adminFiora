import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * Directorio base de almacenamiento local para imágenes
 * Estructura: /public/uploads/productos/{CODIGO-PRODUCTO}/imagen_{numero}.jpg
 */
const UPLOAD_BASE_DIR = path.join(process.cwd(), 'public', 'uploads', 'productos')

/**
 * Garantiza que el directorio para un producto existe
 * @param codigoProducto - Código del producto (ej: "ORO-001")
 */
async function ensureProductUploadDir(codigoProducto: string) {
  try {
    const productDir = path.join(UPLOAD_BASE_DIR, codigoProducto)
    await fs.mkdir(productDir, { recursive: true })
    return productDir
  } catch (error) {
    console.error('Error creating product upload directory:', error)
    throw new Error('No se pudo crear directorio de almacenamiento')
  }
}

/**
 * Obtiene el directorio del producto
 */
function getProductDir(codigoProducto: string): string {
  return path.join(UPLOAD_BASE_DIR, codigoProducto)
}

/**
 * Sube una imagen desde base64 al almacenamiento local
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

    // Crear directorio si no existe
    const uploadDir = await ensureProductUploadDir(codigoProducto)
    
    // Generar nombre: imagen_{numero}.{ext}
    const filename = `imagen_${numeroImagen}.${ext}`

    // Convertir base64 a buffer
    const imageBuffer = Buffer.from(base64String, 'base64')

    // Guardar archivo
    const filePath = path.join(uploadDir, filename)
    await fs.writeFile(filePath, imageBuffer)

    // Generar URL pública
    const publicUrl = `/uploads/productos/${codigoProducto}/${filename}`

    console.log(`✓ Imagen guardada: ${publicUrl}`)

    return {
      url: publicUrl,
      nombreArchivo: filename,
      tamano: imageBuffer.length,
      tipo: `image/${ext}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al guardar imagen'
    console.error('❌ Error uploading image locally:', message)
    throw new Error(`Error al guardar imagen: ${message}`)
  }
}

/**
 * Reorganiza imágenes después de eliminar una
 * Renombra imagen_1.jpg, imagen_2.jpg a imagen_0.jpg, imagen_1.jpg etc
 * @param codigoProducto - Código del producto
 * @param imagenAEliminar - Número de imagen a eliminar (0-based)
 * @returns Array de archivos que quedan después de reorganizar
 */
export async function reorganizeImages(codigoProducto: string, imagenAEliminar: number) {
  try {
    const productDir = getProductDir(codigoProducto)

    // Obtener lista de archivos
    const files = await fs.readdir(productDir)
    const imageFiles = files.filter((f) => f.match(/^imagen_\d+\.(jpg|png|jpeg|webp)$/))

    if (imageFiles.length === 0) {
      // Carpeta vacía, eliminarla
      try {
        await fs.rmdir(productDir)
        console.log(`✓ Carpeta eliminada: ${productDir}`)
      } catch {
        // Ignorar si no está vacía
      }
      return []
    }

    // Renombrar archivos para mantener secuencia 0, 1, 2...
    const nuevoIndice: { [key: number]: number } = {}
    let contador = 0

    for (let i = 0; i < imageFiles.length; i++) {
      if (i !== imagenAEliminar) {
        nuevoIndice[i] = contador
        contador++
      }
    }

    // Renombrar archivos
    for (const [oldIndex, newIndex] of Object.entries(nuevoIndice)) {
      const oldFile = imageFiles[parseInt(oldIndex)]
      const ext = oldFile.split('.').pop()
      const oldPath = path.join(productDir, oldFile)
      const newPath = path.join(productDir, `imagen_${newIndex}.${ext}`)

      if (oldPath !== newPath) {
        await fs.rename(oldPath, newPath)
        console.log(`✓ Renombrado: ${oldFile} → imagen_${newIndex}.${ext}`)
      }
    }

    // Retornar lista de nuevos archivos
    const filesAfter = await fs.readdir(productDir)
    return filesAfter.filter((f) => f.match(/^imagen_\d+\.(jpg|png|jpeg|webp)$/))
  } catch (error) {
    console.error('❌ Error reorganizando imágenes:', error)
    throw error
  }
}

/**
 * Elimina una imagen del almacenamiento local
 * @param codigoProducto - Código del producto
 * @param filename - Nombre del archivo a eliminar
 */
export async function deleteImageLocal(codigoProducto: string, filename: string) {
  try {
    const filePath = path.join(UPLOAD_BASE_DIR, codigoProducto, filename)
    
    // Verificar que el archivo está en el directorio correcto
    const productDir = path.join(UPLOAD_BASE_DIR, codigoProducto)
    if (!filePath.startsWith(productDir)) {
      throw new Error('Ruta de archivo no válida')
    }

    await fs.unlink(filePath)
    console.log(`✓ Imagen eliminada: ${codigoProducto}/${filename}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar imagen'
    console.error('❌ Error deleting image:', message)
    // No lanzar error, solo registrar
  }
}

/**
 * Obtiene la ruta pública de una imagen
 */
export function getImageUrl(codigoProducto: string, filename: string): string {
  return `/uploads/productos/${codigoProducto}/${filename}`
}
