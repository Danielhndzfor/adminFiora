import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * Directorio de almacenamiento local para imágenes
 */
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'productos')

/**
 * Garantiza que el directorio existe
 */
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating upload directory:', error)
    throw new Error('No se pudo crear directorio de almacenamiento')
  }
}

/**
 * Sube una imagen desde base64 al almacenamiento local
 * @param base64Data - Datos base64 de la imagen (ej: "data:image/jpeg;base64,...")
 * @param options - Opciones { codigoProducto, numeroImagen }
 * @returns Objeto con url e información de la imagen
 */
export async function uploadImageLocal(
  base64Data: string,
  options: { codigoProducto?: string; numeroImagen?: number } = {}
) {
  try {
    await ensureUploadDir()

    // Validar formato base64
    const matches = base64Data.match(/data:image\/(\w+);base64,(.+)/)
    if (!matches) {
      throw new Error('Formato de imagen inválido')
    }

    const [, fileType, base64String] = matches
    const ext = fileType.toLowerCase() === 'jpeg' ? 'jpg' : fileType.toLowerCase()

    // Generar nombre: {codigoProducto}_{numeroImagen}.{ext} o timestamp si no hay código
    let filename: string
    if (options.codigoProducto && options.numeroImagen !== undefined) {
      filename = `${options.codigoProducto}_${options.numeroImagen}.${ext}`
    } else {
      // Fallback para uploads sin código de producto
      const timestamp = Date.now()
      const random = crypto.randomBytes(4).toString('hex')
      filename = `${timestamp}_${random}.${ext}`
    }

    // Convertir base64 a buffer
    const imageBuffer = Buffer.from(base64String, 'base64')

    // Guardar archivo
    const filePath = path.join(UPLOAD_DIR, filename)
    await fs.writeFile(filePath, imageBuffer)

    // Generar URL pública
    const publicUrl = `/uploads/productos/${filename}`

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
 * Elimina una imagen del almacenamiento local
 * @param filename - Nombre del archivo a eliminar
 */
export async function deleteImageLocal(filename: string) {
  try {
    const filePath = path.join(UPLOAD_DIR, filename)
    
    // Verificar que el archivo está en el directorio de upload
    if (!filePath.startsWith(UPLOAD_DIR)) {
      throw new Error('Ruta de archivo no válida')
    }

    await fs.unlink(filePath)
    console.log(`✓ Imagen eliminada: ${filename}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar imagen'
    console.error('❌ Error deleting image:', message)
    // No lanzar error, solo registrar
  }
}

/**
 * Obtiene la ruta pública de una imagen
 */
export function getImageUrl(filename: string): string {
  return `/uploads/productos/${filename}`
}

/**
 * Genera nombre de archivo para migración
 * @param codigoProducto - Código del producto (ej: "ORO-001")
 * @param numeroImagen - Índice de la imagen (0, 1, 2...)
 * @param extension - Extensión del archivo (jpg, png, etc)
 */
export function generateLocalFilename(
  codigoProducto: string,
  numeroImagen: number,
  extension: string = 'jpg'
): string {
  return `${codigoProducto}_${numeroImagen}.${extension}`
}
