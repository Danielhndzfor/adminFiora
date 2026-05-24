import { NextResponse } from 'next/server'
import { pingFTP } from '@/lib/ftp-service'

/** GET /api/ftp-ping
 * Prueba la conectividad FTP al VPS de imágenes.
 * Solo devuelve el resultado — no requiere auth para facilitar diagnóstico post-login.
 */
export async function GET() {
  const result = await pingFTP()
  return NextResponse.json(result, { status: result.ok ? 200 : 503 })
}
