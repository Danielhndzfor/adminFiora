/**
 * Endpoint para probar conectividad con el VPS
 * GET /api/test-vps-url
 */

import { NextResponse } from 'next/server'
import axios from 'axios'

const VPS_BASE_URL = process.env.FTP_BASE_URL || 'https://fiora.mascontrol.app/fioraImages'

interface TestResult {
  name: string
  passed: boolean
  message: string
  data?: any
  error?: string
}

export async function GET(request: Request) {
  const results: TestResult[] = []

  try {
    // Test 1: Verificar que FTP_BASE_URL está configurado
    const urlConfigured = !!process.env.FTP_BASE_URL

    results.push({
      name: 'Configuración VPS URL',
      passed: urlConfigured,
      message: urlConfigured ? `VPS URL: ${VPS_BASE_URL}` : 'FTP_BASE_URL no está configurado',
      data: { url: VPS_BASE_URL },
    })

    // Test 2: Intentar HEAD request a la URL base
    try {
      const headResponse = await axios.head(VPS_BASE_URL, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      })

      results.push({
        name: 'Accesibilidad (HEAD)',
        passed: headResponse.status === 200 || headResponse.status === 403,
        message: `Status: ${headResponse.status}${headResponse.status === 403 ? ' (Directorio existe pero acceso limitado)' : ''}`,
        data: { status: headResponse.status, headers: headResponse.headers },
      })
    } catch (error: any) {
      results.push({
        name: 'Accesibilidad (HEAD)',
        passed: false,
        message: 'No se puede conectar al VPS',
        error: error.message,
      })
    }

    // Test 3: Intentar GET request
    try {
      const getResponse = await axios.get(VPS_BASE_URL, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      })

      const isHtmlListing =
        getResponse.data.includes('<html') ||
        getResponse.data.includes('<body') ||
        getResponse.data.includes('Index of')

      results.push({
        name: 'Acceso GET',
        passed: getResponse.status === 200,
        message: getResponse.status === 200 ? 'Acceso exitoso' : `Status: ${getResponse.status}`,
        data: {
          status: getResponse.status,
          isHtmlListing,
          contentType: getResponse.headers['content-type'],
          sampleContent: getResponse.data.substring(0, 200),
        },
      })
    } catch (error: any) {
      results.push({
        name: 'Acceso GET',
        passed: false,
        message: 'Error al intentar GET',
        error: error.message,
      })
    }

    // Test 4: Intentar acceder a un archivo de prueba
    const testImageUrl = `${VPS_BASE_URL}/test-image.png`

    try {
      const imageResponse = await axios.head(testImageUrl, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      })

      results.push({
        name: 'Archivo de Prueba',
        passed: imageResponse.status === 200,
        message:
          imageResponse.status === 200
            ? 'test-image.png existe'
            : `Status: ${imageResponse.status} (archivo no existe)`,
        data: { status: imageResponse.status, url: testImageUrl },
      })
    } catch (error: any) {
      results.push({
        name: 'Archivo de Prueba',
        passed: false,
        message: 'No se puede acceder a test-image.png',
        error: error.message,
      })
    }

    // Test 5: Verificar si puedes hacer POST (subir archivo)
    const uploadTestUrl = `${VPS_BASE_URL}/upload.php`

    try {
      const uploadResponse = await axios.post(uploadTestUrl, {}, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      })

      results.push({
        name: 'Capacidad POST (upload.php)',
        passed: uploadResponse.status < 400,
        message:
          uploadResponse.status === 200
            ? 'Endpoint POST disponible'
            : `Status: ${uploadResponse.status} (posible pero con restricciones)`,
        data: { status: uploadResponse.status, url: uploadTestUrl },
      })
    } catch (error: any) {
      results.push({
        name: 'Capacidad POST (upload.php)',
        passed: false,
        message: 'No hay endpoint POST disponible',
        error: error.message,
      })
    }

    // Resumen
    const passed = results.filter((r) => r.passed).length
    const total = results.length

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        vpsUrl: VPS_BASE_URL,
        summary: {
          passed,
          total,
          readyForUse: passed >= 3,
        },
        results,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error en prueba de VPS',
        details: String(error),
      },
      { status: 500 }
    )
  }
}
