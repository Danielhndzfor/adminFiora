import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { uploadImageFromBase64 } from '@/lib/cloudinary'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, imageBase64 } = body

        if (!imageBase64) {
            return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 })
        }

        const upload = await uploadImageFromBase64(imageBase64, { folder: 'fiora' })

        const product = await prisma.product.create({
            data: {
                name: name ?? 'Sin nombre',
                image: upload.secure_url,
            },
        })

        return NextResponse.json({ product, upload })
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 })
    }
}
