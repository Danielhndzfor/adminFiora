import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * Test database connection
 * GET /api/test-db
 */
export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as connected`
    console.log('✅ Database connected:', result)

    // Test if Producto table exists and has data
    const productCount = await prisma.producto.count()
    console.log(`✅ Found ${productCount} products`)

    return NextResponse.json({
      status: 'ok',
      message: 'Database connection successful',
      productCount,
    })
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
