'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function TestVPSPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)

  // Test 1: Probar accesibilidad de URL
  const testVPSUrl = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-vps-url')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  // Test 2: Probar upload
  const testVPSUpload = async () => {
    if (!imageFile) {
      alert('Por favor selecciona una imagen')
      return
    }

    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const response = await fetch('/api/test-vps-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            filename: imageFile.name,
          }),
        })
        const data = await response.json()
        setUploadResult(data)
      }
      reader.readAsDataURL(imageFile)
    } catch (error) {
      setUploadResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🧪 Pruebas VPS</h1>
        <p className="text-gray-600 mb-6">Valida la conectividad y capacidades del VPS fiora.mascontrol.app</p>

        {/* Test 1: Accesibilidad */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Probar Accesibilidad del VPS</h2>
          <p className="text-sm text-gray-600 mb-4">
            Verifica si la URL del VPS está accesible y qué métodos HTTP soporta.
          </p>
          <Button onClick={testVPSUrl} disabled={loading} className="w-full">
            {loading ? 'Probando...' : '▶ Probar Accesibilidad'}
          </Button>

          {results && (
            <div className="mt-6 bg-white border rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-xs text-gray-700">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </Card>

        {/* Test 2: Upload */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. Probar Upload de Imagen</h2>
          <p className="text-sm text-gray-600 mb-4">
            Sube una imagen para verificar si el VPS puede recibirla.
          </p>

          <div className="space-y-4">
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="mb-2"
              />
              {imageFile && <p className="text-sm text-green-600">✓ {imageFile.name} seleccionado</p>}
            </div>

            <Button onClick={testVPSUpload} disabled={loading || !imageFile} className="w-full">
              {loading ? 'Subiendo...' : '▶ Probar Upload'}
            </Button>
          </div>

          {uploadResult && (
            <div className="mt-6 bg-white border rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-xs text-gray-700">
                {JSON.stringify(uploadResult, null, 2)}
              </pre>

              {uploadResult.results?.some((r: any) => r.success) && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-700">
                    ✓ Upload fue exitoso. El VPS puede recibir imágenes.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Información util */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-2">💡 Qué significan los resultados:</h3>
          <ul className="text-sm space-y-2 text-gray-700">
            <li>
              <strong>✓ Accesibilidad (HEAD):</strong> La URL del VPS existe y es accesible
            </li>
            <li>
              <strong>✓ Acceso GET:</strong> Puedes obtener/descargar imágenes de ahí
            </li>
            <li>
              <strong>✓ POST a upload.php:</strong> El VPS tiene endpoint para recibir archivos
            </li>
            <li>
              <strong>✓ PUT directo:</strong> Alternativa segura para subir archivos
            </li>
            <li>
              <strong>Ver métodos (OPTIONS):</strong> Muestra qué operaciones soporta el VPS
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
