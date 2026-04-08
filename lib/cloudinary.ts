import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImageFromBase64(base64: string, options: Record<string, any> = {}) {
  // base64 should be a data URI: data:image/png;base64,....
  const result = await cloudinary.uploader.upload(base64, options)
  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  }
}

/**
 * Elimina una imagen de Cloudinary por su public_id
 */
export async function deleteImageFromCloudinary(publicId: string | null | undefined): Promise<boolean> {
  if (!publicId) return false
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error)
    return false
  }
}

export default cloudinary
