import sharp from 'sharp'

export interface OptimizedImage {
  buffer: Buffer
  originalSize: number
  optimizedSize: number
  compressionRatio: number
}

/**
 * Optimiza una imagen: redimensiona si es muy grande y convierte a WebP
 */
export async function optimizeImage(buffer: Buffer): Promise<OptimizedImage> {
  const originalSize = buffer.length

  const optimizedBuffer = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer()

  return {
    buffer: optimizedBuffer,
    originalSize,
    optimizedSize: optimizedBuffer.length,
    compressionRatio: Math.round((1 - optimizedBuffer.length / originalSize) * 100),
  }
}

export function isValidImageType(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(mimeType)
}
