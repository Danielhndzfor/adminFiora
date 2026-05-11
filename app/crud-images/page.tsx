'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'

interface ImageItem {
  filename: string
  url: string
  size: number
  createdAt: string
}

export default function CRUDImagesPage() {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<ImageItem[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [updateFile, setUpdateFile] = useState<File | null>(null)
  const [updateResult, setUpdateResult] = useState<any>(null)
  const [deleteResult, setDeleteResult] = useState<any>(null)
  const { toast } = useToast()

  // CREATE - Subir imagen
  const handleUpload = async () => {
    if (!uploadFile) {
      alert('Selecciona una imagen para subir')
      return
    }

    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const response = await fetch('/api/crud-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            filename: uploadFile.name,
          }),
        })
        const data = await response.json()
        setUploadResult(data)
        
        // Si hay error sobre scripts PHP
        if (data.error && data.error.includes('Los scripts PHP no existen')) {
          toast.error('⚠️ Scripts PHP no creados', {
            description: 'Necesitas crear los 4 archivos en /httpdocs/api/ del VPS',
          })
        } else if (data.success) {
          toast.success('✅ Imagen subida exitosamente')
          setUploadFile(null)
          // Recargar lista
          await loadImages()
        }
      }
      reader.readAsDataURL(uploadFile)
    } catch (error) {
      setUploadResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  // READ - Obtener lista de imágenes
  const loadImages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/crud-images?action=list')
      const data = await response.json()
      console.log('Respuesta GET:', data)
      
      // Si hay error sobre scripts PHP
      if (data.error && data.error.includes('Los scripts PHP no existen')) {
        toast.error('⚠️ Scripts PHP no creados', {
          description: 'Necesitas crear los 4 archivos en /httpdocs/api/ del VPS',
        })
        setImages([])
        return
      }
      
      if (data.success && data.images) {
        const imagesWithFullUrl = data.images.map((img: any) => ({
          ...img,
          url: img.url.startsWith('http') 
            ? img.url 
            : `https://fiora.mascontrol.app${img.url}`,
        }))
        setImages(imagesWithFullUrl)
      } else if (data.images) {
        setImages(data.images)
      } else {
        console.error('Respuesta sin imágenes:', data)
        setImages([])
      }
    } catch (error) {
      console.error('Error cargando imágenes:', error)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  // UPDATE - Actualizar imagen
  const handleUpdate = async () => {
    if (!selectedImage || !updateFile) {
      alert('Selecciona una imagen para actualizar y un archivo nuevo')
      return
    }

    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const response = await fetch('/api/crud-images', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldFilename: selectedImage.filename,
            imageBase64: base64,
            newFilename: `${Date.now()}_${updateFile.name}`,
          }),
        })
        const data = await response.json()
        setUpdateResult(data)
        setUpdateFile(null)
        // Recargar lista
        await loadImages()
        setSelectedImage(null)
      }
      reader.readAsDataURL(updateFile)
    } catch (error) {
      setUpdateResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  // DELETE - Eliminar imagen
  const handleDelete = async (filename: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/crud-images?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      setDeleteResult(data)
      // Recargar lista
      await loadImages()
    } catch (error) {
      setDeleteResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">📸 CRUD de Imágenes</h1>
        <p className="text-gray-600 mb-6">Prueba Create, Read, Update, Delete de imágenes en el VPS</p>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">➕ Crear</TabsTrigger>
            <TabsTrigger value="read">👁️ Leer</TabsTrigger>
            <TabsTrigger value="update">✏️ Actualizar</TabsTrigger>
            <TabsTrigger value="delete">🗑️ Eliminar</TabsTrigger>
          </TabsList>

          {/* CREATE */}
          <TabsContent value="create">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Subir Nueva Imagen (CREATE)</h2>
              <p className="text-sm text-gray-600 mb-4">Selecciona una imagen y súbela al servidor</p>

              <div className="space-y-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  disabled={loading}
                />

                {uploadFile && (
                  <p className="text-sm text-green-600">✓ {uploadFile.name} seleccionado ({Math.round(uploadFile.size / 1024)} KB)</p>
                )}

                <Button onClick={handleUpload} disabled={loading || !uploadFile} className="w-full">
                  {loading ? 'Subiendo...' : '⬆️ Subir Imagen'}
                </Button>

                {uploadResult && (
                  <div className={`p-4 rounded-lg ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    {uploadResult.success ? (
                      <>
                        <p className="text-green-700 font-semibold">✓ Exitoso</p>
                        <p className="text-sm text-green-600 mt-2">{uploadResult.message}</p>
                        <p className="text-xs text-gray-600 mt-2">Archivo: {uploadResult.filename}</p>
                        <p className="text-xs text-gray-600">URL: <a href={`https://fiora.mascontrol.app${uploadResult.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{uploadResult.url}</a></p>
                        <p className="text-xs text-gray-600">Tamaño: {Math.round(uploadResult.size / 1024)} KB</p>
                      </>
                    ) : (
                      <>
                        <p className="text-red-700 font-semibold">✗ Error</p>
                        <p className="text-sm text-red-600 mt-2">{uploadResult.error}</p>
                        {uploadResult.details && (
                          <p className="text-xs text-red-500 mt-1">Detalles: {uploadResult.details}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* READ */}
          <TabsContent value="read">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Obtener Imágenes (READ)</h2>
              <p className="text-sm text-gray-600 mb-4">Carga la lista de imágenes subidas</p>

              <Button onClick={loadImages} disabled={loading} className="w-full mb-6">
                {loading ? 'Cargando...' : '🔄 Cargar Lista de Imágenes'}
              </Button>

              {images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((img) => (
                    <Card key={img.filename} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedImage(img)}>
                      <div className="relative h-40 bg-gray-100">
                        <Image
                          src={img.url}
                          alt={img.filename}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-mono truncate">{img.filename}</p>
                        <p className="text-xs text-gray-600">{Math.round(img.size / 1024)} KB</p>
                        <p className="text-xs text-gray-500">{new Date(img.createdAt).toLocaleString('es-MX')}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay imágenes subidas aún</p>
              )}
            </Card>
          </TabsContent>

          {/* UPDATE */}
          <TabsContent value="update">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Actualizar Imagen (UPDATE)</h2>
              <p className="text-sm text-gray-600 mb-4">Selecciona una imagen de la lista y reemplázala</p>

              {images.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">1. Selecciona imagen a actualizar</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {images.map((img) => (
                        <button
                          key={img.filename}
                          onClick={() => setSelectedImage(img)}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            selectedImage?.filename === img.filename
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="relative h-20 bg-gray-100 mb-2">
                            <Image
                              src={img.url}
                              alt={img.filename}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="text-xs truncate">{img.filename.slice(0, 15)}</p>
                        </button>
                      ))}
                    </div>

                    {selectedImage && (
                      <p className="text-sm text-green-600 mt-2">✓ Seleccionado: {selectedImage.filename}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">2. Selecciona nueva imagen</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUpdateFile(e.target.files?.[0] || null)}
                      disabled={loading}
                    />
                    {updateFile && (
                      <p className="text-sm text-green-600 mt-2">✓ {updateFile.name} seleccionado</p>
                    )}
                  </div>

                  <Button
                    onClick={handleUpdate}
                    disabled={loading || !selectedImage || !updateFile}
                    className="w-full"
                  >
                    {loading ? 'Actualizando...' : '✏️ Actualizar Imagen'}
                  </Button>

                  {updateResult && (
                    <div className={`p-4 rounded-lg ${updateResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      {updateResult.success ? (
                        <>
                          <p className="text-green-700 font-semibold">✓ Actualizado</p>
                          <p className="text-sm text-green-600 mt-2">{updateResult.message}</p>
                          <p className="text-xs text-gray-600 mt-2">Nueva URL: <a href={`https://fiora.mascontrol.app${updateResult.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{updateResult.url}</a></p>
                        </>
                      ) : (
                        <>
                          <p className="text-red-700 font-semibold">✗ Error</p>
                          <p className="text-sm text-red-600 mt-2">{updateResult.error}</p>
                          {updateResult.details && (
                            <p className="text-xs text-red-500 mt-1">Detalles: {updateResult.details}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Primero carga la lista de imágenes en la pestaña "Leer"</p>
              )}
            </Card>
          </TabsContent>

          {/* DELETE */}
          <TabsContent value="delete">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Eliminar Imagen (DELETE)</h2>
              <p className="text-sm text-gray-600 mb-4">Elige una imagen para eliminar del servidor</p>

              {images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((img) => (
                    <Card key={img.filename} className="overflow-hidden">
                      <div className="relative h-40 bg-gray-100">
                        <Image
                          src={img.url}
                          alt={img.filename}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-mono truncate mb-3">{img.filename}</p>
                        <Button
                          variant="destructive"
                          className="w-full text-xs"
                          onClick={() => handleDelete(img.filename)}
                          disabled={loading}
                        >
                          🗑️ Eliminar
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Primero carga la lista de imágenes en la pestaña "Leer"</p>
              )}

              {deleteResult && (
                <div className={`mt-6 p-4 rounded-lg ${deleteResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {deleteResult.success ? (
                    <>
                      <p className="text-green-700 font-semibold">✓ Eliminado</p>
                      <p className="text-sm text-green-600 mt-2">{deleteResult.message}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-red-700 font-semibold">✗ Error</p>
                      <p className="text-sm text-red-600 mt-2">{deleteResult.error}</p>
                      {deleteResult.details && (
                        <p className="text-xs text-red-500 mt-1">Detalles: {deleteResult.details}</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

          {/* Información sobre el VPS */}
        <Card className="p-6 mt-8 bg-red-50 border-red-200">
          <h3 className="font-semibold mb-3 text-red-900">❌ Problema: Scripts PHP no Creados</h3>
          <p className="text-sm text-red-800 mb-3">
            Si ves errores al cargar imágenes, es porque los scripts PHP aún no están en tu VPS.
          </p>
          <div className="bg-white border border-red-200 rounded p-3 mb-3 text-xs font-mono">
            <p className="text-red-600">Error esperado: "Unexpected token '&lt;', "&lt;!DOCTYPE"</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
            <p className="text-sm font-semibold mb-2">✅ Solución Rápida:</p>
            <ol className="text-xs space-y-2 text-gray-700">
              <li>1. Abre: <code className="bg-gray-200 px-2 py-1 rounded">VPS_SCRIPTS_COPY_PASTE.md</code></li>
              <li>2. Copia cada script PHP</li>
              <li>3. Pégalos en tu VPS en: <code className="bg-gray-200 px-2 py-1 rounded">/httpdocs/api/</code></li>
              <li>4. Recarga esta página</li>
            </ol>
          </div>
          <p className="text-xs text-gray-600">
            📖 Ver diagnóstico completo: <code className="bg-gray-200 px-2 py-1 rounded">DIAGNOSTIC_VPS.md</code>
          </p>
        </Card>
      </div>
    </div>
  )
}
