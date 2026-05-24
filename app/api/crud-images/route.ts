/**
 * Endpoint CRUD - Proxy al VPS
 * Todos los archivos se envían directamente al VPS por URL
 * 
 * POST /api/crud-images - Subir imagen al VPS
 * GET /api/crud-images?action=list - Listar imágenes del VPS
 * PUT /api/crud-images - Actualizar imagen del VPS
 * DELETE /api/crud-images?filename=xxx - Eliminar del VPS
 */

import { NextResponse } from 'next/server'

const VPS_API_BASE = 'https://fiora.mascontrol.app/api'

// POST - Subir imagen al VPS
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageBase64, filename } = body

    if (!imageBase64 || !filename) {
      return NextResponse.json(
        { error: 'imageBase64 y filename son requeridos' },
        { status: 400 }
      )
    }

    const response = await fetch(`${VPS_API_BASE}/upload-image.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        filename,
      }),
    })

    const text = await response.text()
    
    // Validar que la respuesta sea JSON
    if (!text.startsWith('{') && !text.startsWith('[')) {
      console.error('VPS devolvió HTML, no JSON:', text.substring(0, 100))
      return NextResponse.json(
        { 
          error: 'VPS no respondió con JSON. Los scripts PHP no existen en /fiora.mascontrol.app/api/',
          detail: 'Asegúrate de crear: upload-image.php, get-image.php, update-image.php, delete-image.php',
          received: text.substring(0, 100)
        },
        { status: 500 }
      )
    }

    const data = JSON.parse(text)
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error POST:', error.message)
    return NextResponse.json(
      { error: 'Error al subir imagen', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Listar imágenes del VPS
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const filename = searchParams.get('filename')

    if (action === 'list') {
      const response = await fetch(`${VPS_API_BASE}/get-image.php?action=list`)
      const text = await response.text()
      
      // Validar que la respuesta sea JSON
      if (!text.startsWith('{') && !text.startsWith('[')) {
        console.error('VPS devolvió HTML, no JSON:', text.substring(0, 100))
        return NextResponse.json(
          { 
            error: 'VPS no respondió con JSON. Los scripts PHP no existen en /fiora.mascontrol.app/api/',
            detail: 'Asegúrate de crear: upload-image.php, get-image.php, update-image.php, delete-image.php',
            received: text.substring(0, 100)
          },
          { status: 500 }
        )
      }
      
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: response.status })
    }

    if (filename) {
      const response = await fetch(`${VPS_API_BASE}/get-image.php?filename=${encodeURIComponent(filename)}`)
      const text = await response.text()
      
      // Validar que la respuesta sea JSON
      if (!text.startsWith('{') && !text.startsWith('[')) {
        console.error('VPS devolvió HTML, no JSON:', text.substring(0, 100))
        return NextResponse.json(
          { 
            error: 'VPS no respondió con JSON. Los scripts PHP no existen en /fiora.mascontrol.app/api/',
            detail: 'Asegúrate de crear: upload-image.php, get-image.php, update-image.php, delete-image.php',
            received: text.substring(0, 100)
          },
          { status: 500 }
        )
      }
      
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(
      { error: 'Especifica action=list o filename' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error GET:', error.message)
    return NextResponse.json(
      { error: 'Error al obtener imágenes', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Actualizar imagen del VPS
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { oldFilename, imageBase64, newFilename } = body

    if (!oldFilename || !imageBase64) {
      return NextResponse.json(
        { error: 'oldFilename e imageBase64 son requeridos' },
        { status: 400 }
      )
    }

    const response = await fetch(`${VPS_API_BASE}/update-image.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldFilename,
        imageBase64,
        newFilename,
      }),
    })

    const text = await response.text()
    
    // Validar que la respuesta sea JSON
    if (!text.startsWith('{') && !text.startsWith('[')) {
      console.error('VPS devolvió HTML, no JSON:', text.substring(0, 100))
      return NextResponse.json(
        { 
          error: 'VPS no respondió con JSON. Los scripts PHP no existen en /fiora.mascontrol.app/api/',
          detail: 'Asegúrate de crear: upload-image.php, get-image.php, update-image.php, delete-image.php',
          received: text.substring(0, 100)
        },
        { status: 500 }
      )
    }

    const data = JSON.parse(text)
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error PUT:', error.message)
    return NextResponse.json(
      { error: 'Error al actualizar imagen', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar imagen del VPS
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json(
        { error: 'filename es requerido' },
        { status: 400 }
      )
    }

    const response = await fetch(`${VPS_API_BASE}/delete-image.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    })

    const text = await response.text()
    
    // Validar que la respuesta sea JSON
    if (!text.startsWith('{') && !text.startsWith('[')) {
      console.error('VPS devolvió HTML, no JSON:', text.substring(0, 100))
      return NextResponse.json(
        { 
          error: 'VPS no respondió con JSON. Los scripts PHP no existen en /fiora.mascontrol.app/api/',
          detail: 'Asegúrate de crear: upload-image.php, get-image.php, update-image.php, delete-image.php',
          received: text.substring(0, 100)
        },
        { status: 500 }
      )
    }

    const data = JSON.parse(text)
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error DELETE:', error.message)
    return NextResponse.json(
      { error: 'Error al eliminar imagen', details: error.message },
      { status: 500 }
    )
  }
}
