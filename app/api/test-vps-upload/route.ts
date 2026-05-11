/**
 * Endpoint para probar upload de imágenes al VPS
 * POST /api/test-vps-upload
 * 
 * Body: { imageBase64: "data:image/png;base64,..." }
 */

import { NextResponse } from 'next/server'
import axios from 'axios'
import FormData from 'form-data'

const VPS_BASE_URL = process.env.FTP_BASE_URL || 'https://fiora.mascontrol.app/fioraImages'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageBase64, filename } = body

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'imageBase64 es requerido en el body' },
        { status: 400 }
      )
    }

    // Convertir base64 a buffer
    const matches = imageBase64.match(/data:image\/(\w+);base64,(.+)/)
    if (!matches) {
      return NextResponse.json(
        { error: 'Formato base64 inválido. Debe ser: data:image/png;base64,...' },
        { status: 400 }
      )
    }

    const [, mimeType, data] = matches
    const buffer = Buffer.from(data, 'base64')
    const ext = mimeType.toLowerCase()
    const testFilename = filename || `test-${Date.now()}.${ext}`

    const results = []

    // Test 1: Verificar URL del VPS
    results.push({
      name: 'Configuración',
      value: `VPS: ${VPS_BASE_URL}`,
      fileSize: `${buffer.length} bytes`,
      filename: testFilename,
    })

    // Test 2: Intentar POST directo (si existe upload.php)
    try {
      const formData = new FormData()
      formData.append('file', buffer, testFilename)

      const uploadResponse = await axios.post(`${VPS_BASE_URL}/upload.php`, formData, {
        headers: formData.getHeaders(),
        timeout: 10000,
        validateStatus: (status) => true,
      })

      results.push({
        name: 'POST a upload.php',
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        response: uploadResponse.data,
        success: uploadResponse.status < 300,
      })

      // Si fue exitoso, verificar si el archivo está disponible
      if (uploadResponse.status < 300) {
        try {
          const fileCheckUrl = `${VPS_BASE_URL}/${testFilename}`
          const fileCheck = await axios.head(fileCheckUrl, { timeout: 5000 })

          results.push({
            name: 'Verificar archivo subido',
            status: fileCheck.status,
            url: fileCheckUrl,
            accessible: true,
          })
        } catch (e) {
          results.push({
            name: 'Verificar archivo subido',
            accessible: false,
            note: 'Archivo no encontrado después de upload (posible ruta diferente)',
          })
        }
      }
    } catch (error: any) {
      results.push({
        name: 'POST a upload.php',
        success: false,
        error: error.message,
        note: 'upload.php no existe o no es accesible',
      })
    }

    // Test 3: Intentar PUT (alternativa)
    try {
      const putResponse = await axios.put(
        `${VPS_BASE_URL}/${testFilename}`,
        buffer,
        {
          headers: {
            'Content-Type': `image/${ext}`,
          },
          timeout: 10000,
          validateStatus: (status) => true,
        }
      )

      results.push({
        name: 'PUT directo',
        status: putResponse.status,
        statusText: putResponse.statusText,
        response: putResponse.data,
        success: putResponse.status < 300,
      })
    } catch (error: any) {
      results.push({
        name: 'PUT directo',
        success: false,
        error: error.message,
      })
    }

    // Test 4: Obtener información de qué métodos están disponibles
    try {
      const optionsResponse = await axios.options(`${VPS_BASE_URL}/`, {
        timeout: 5000,
        validateStatus: (status) => true,
      })

      results.push({
        name: 'Métodos disponibles (OPTIONS)',
        status: optionsResponse.status,
        methods: optionsResponse.headers['allow'] || 'No especificado',
      })
    } catch (error: any) {
      results.push({
        name: 'Métodos disponibles (OPTIONS)',
        error: error.message,
      })
    }

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        vpsUrl: VPS_BASE_URL,
        testFile: testFilename,
        results,
        nextSteps: [
          'Si POST a upload.php funcionó: puedes usar ese endpoint para subidas',
          'Si PUT funcionó: puedes subir directamente con PUT',
          'Si ninguno funcionó: necesitas crear upload.php en el servidor',
          'Prueba recuperar la imagen con GET después',
        ],
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error en prueba de upload',
        details: String(error),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Endpoint de prueba de upload para VPS',
      usage: {
        method: 'POST',
        url: '/api/test-vps-upload',
        body: {
          imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
          filename: 'opcional-nombre-archivo.png',
        },
      },
      example: `
curl -X POST http://localhost:3000/api/test-vps-upload \\
  -H "Content-Type: application/json" \\
  -d '{
    "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "filename": "test-image.png"
  }'
      `,
    },
    { status: 200 }
  )
}
