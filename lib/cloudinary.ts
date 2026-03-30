import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImageFromBase64(base64: string, options: Record<string, any> = {}) {
  // base64 should be a data URI: data:image/png;base64,....
  const result = await cloudinary.uploader.upload(base64, options)
  return result
}

export default cloudinary
