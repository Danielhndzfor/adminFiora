import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generarCodigoProducto } from '@/lib/product-code-generator'
import { uploadImageFromBase64 } from '@/lib/cloudinary'

/**
 * GET /api/productos
 * Obtiene todos los productos o uno específico
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productoId = searchParams.get('id')
    const palabra = searchParams.get('palabra')

    if (productoId) {
      const producto = await prisma.producto.findUnique({
        where: { id: parseInt(productoId) },
        include: { categoria: true },
      })

      if (!producto) {
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
      }

      return NextResponse.json(producto)
    }

    // Listar productos (con búsqueda opcional)
    const donde: any = { activo: true }
    if (palabra) {
      donde.OR = [
        { nombre: { contains: palabra } },
        { descripcion: { contains: palabra } },
        { palabrasClave: { contains: palabra } },
        { codigo: { contains: palabra } },
      ]
    }

    // Filtro por categoría
    const categoriaId = searchParams.get('categoriaId')
    if (categoriaId) {
      donde.categoriaId = parseInt(categoriaId)
    }

    // Filtro por stock
    const stockFiltro = searchParams.get('stockFiltro')
    if (stockFiltro === 'bajo') {
      donde.stock = { lte: 3 }
    } else if (stockFiltro === 'cero') {
      donde.stock = 0
    }

    // Soporta paginación: page (1-based) y limit
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (Math.max(page, 1) - 1) * limit

    const [total, productos] = await Promise.all([
      prisma.producto.count({ where: donde }),
      prisma.producto.findMany({
        where: donde,
        include: { categoria: true },
        orderBy: { creadoEn: 'desc' },
        skip,
        take: limit,
      }),
    ])

    const hasMore = skip + productos.length < total

    return NextResponse.json({ productos, hasMore })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/**
 * POST /api/productos
 * Crea un nuevo producto
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, descripcion, palabrasClave, precio, costo, stock, imagenBase64, categoriaId } = body

    if (!nombre || !precio || stock === undefined || !categoriaId) {
      return NextResponse.json(
        { error: 'nombre, precio, stock, categoriaId son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la categoría existe
    const categoria = await prisma.categoriaCatalogo.findUnique({
      where: { id: categoriaId },
    })
    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    // Generar código automático
    const codigo = await generarCodigoProducto()

    // Subir imagen a Cloudinary si existe
    let urlImagen = null
    let publicIdImagen = null
    if (imagenBase64) {
      const resultado = await uploadImageFromBase64(imagenBase64, {
        folder: 'fiora/productos',
      })
      urlImagen = resultado.secure_url
      publicIdImagen = resultado.public_id
    }

    // Crear producto
    const producto = await prisma.producto.create({
      data: {
        codigo,
        nombre,
        descripcion: descripcion || undefined,
        palabrasClave: palabrasClave || undefined,
        precio: parseFloat(precio),
        costo: costo ? parseFloat(costo) : undefined,
        stock: parseInt(stock),
        imagen: urlImagen || undefined,
        publicIdImagen: publicIdImagen || undefined,
        categoriaId,
      },
      include: { categoria: true },
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
