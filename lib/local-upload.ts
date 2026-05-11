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
    // Validar formato base64
    const matches = base64Data.match(/data:image\/(\w+);base64,(.+)/)
    if (!matches) {
      throw new Error('Formato de imagen inválido')
    }

    const [, fileType, base64String] = matches
    const ext = fileType.toLowerCase() === 'jpeg' ? 'jpg' : fileType.toLowerCase()

    // Generar nombre: imagen_{numeroImagen}.{ext}
    let filename: string
    let uploadDir: string
    
    if (options.codigoProducto && options.numeroImagen !== undefined) {
      uploadDir = await ensureProductUploadDir(options.codigoProducto)
      filename = `imagen_${options.numeroImagen}.${ext}`
    } else {
      // Fallback para uploads sin código de producto
      uploadDir = UPLOAD_BASE_DIR
      await fs.mkdir(uploadDir, { recursive: true })
      const timestamp = Date.now()
      const random = crypto.randomBytes(4).toString('hex')
      filename = `${timestamp}_${random}.${ext}`
    }

    // Convertir base64 a buffer
    const imageBuffer = Buffer.from(base64String, 'base64')

    // Guardar archivo
    const filePath = path.join(uploadDir, filename)
    await fs.writeFile(filePath, imageBuffer)

    // Generar URL pública
    let publicUrl: string
    if (options.codigoProducto) {
      publicUrl = `/uploads/productos/${options.codigoProducto}/${filename}`
    } else {
      publicUrl = `/uploads/productos/${filename}`
    }

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
