'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Check, AlertCircle, Download, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Producto {
  id: number
  codigo: string
  nombre: string
  imagenes: string
}

interface ImagenData {
  url: string
  nombreArchivo: string
  orden: number
  creadoEn: string
}

export default function MigratePage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoPrueba, setProductoPrueba] = useState<Producto | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [migrando, setMigrando] = useState(false)
  const [migracionCompleta, setMigracionCompleta] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [pruebaPasada, setPruebaPasada] = useState(false)

  // Cargar productos con imágenes de Cloudinary
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        // Primero obtener debug info
        const debugResponse = await fetch('/api/migrate/debug')
        const debugData = await debugResponse.json()
        setDebugInfo(debugData)

        // Usar endpoint público para migración (sin requerir token)
        const response = await fetch('/api/migrate/products-to-migrate')

        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || 'Error cargando productos')
          return
        }

        const data = await response.json()
        const productosConImagenes = data.productos || []

        setProductos(productosConImagenes)
        
        // Seleccionar el primero como prueba
        if (productosConImagenes.length > 0) {
          setProductoPrueba(productosConImagenes[0])
        }
      } catch (error) {
        console.error('Error cargando productos:', error)
        toast.error('Error cargando productos')
      } finally {
        setLoading(false)
      }
    }

    cargarProductos()
  }, [])

  const migrarProductoPrueba = async () => {
    if (!productoPrueba) return
    
    setMigrando(true)
    setResultado(null)

    try {
      const response = await fetch('/api/migrate/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productoId: productoPrueba.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Error migrando imagen')
        setResultado({
          error: data.error,
          productoId: productoPrueba.id,
        })
        setPruebaPasada(false)
        return
      }

      setResultado(data)
      toast.success('✅ Imagen de prueba migrada exitosamente')
      setPruebaPasada(true)
    } catch (error) {
      toast.error('Error en la migración')
      setResultado({
        error: error instanceof Error ? error.message : 'Error desconocido',
        productoId: productoPrueba?.id,
      })
      setPruebaPasada(false)
    } finally {
      setMigrando(false)
    }
  }

  const iniciarMigracionCompleta = async () => {
    if (!window.confirm('⚠️ Esto migrará TODAS las imágenes de Cloudinary. ¿Estás seguro?')) {
      return
    }

    setMigracionCompleta(true)
    setResultado(null)

    try {
      const response = await fetch('/api/migrate/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Error en migración completa')
        setResultado(data)
        return
      }

      setResultado(data)
      toast.success(`✅ Migración completa finalizada: ${data.migratedCount} imágenes`)
    } catch (error) {
      toast.error('Error en la migración')
      setResultado({
        error: error instanceof Error ? error.message : 'Error desconocido',
      })
    } finally {
      setMigracionCompleta(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-fiora-gold" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🖼️ Migración de Imágenes</h1>
        <p className="text-gray-400">
          Migrar imágenes de Cloudinary al almacenamiento local del VPS
        </p>
      </div>

      {/* DEBUG INFO */}
      {debugInfo && (
        <div className="bg-gray-900 border border-yellow-600 rounded-lg p-4 mb-6">
          <details className="cursor-pointer">
            <summary className="font-semibold text-yellow-400 hover:text-yellow-300">
              🔍 Debug Info (Click para expandir)
            </summary>
            <div className="mt-3 text-xs text-gray-300 font-mono bg-black p-3 rounded overflow-auto max-h-40">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}

      {/* PASO 1: PRUEBA PILOTO */}
      <div className="bg-fiora-dark-bg border-2 border-fiora-gold rounded-lg p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-fiora-gold text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h2 className="text-2xl font-bold">Prueba Piloto</h2>
        </div>

        {productoPrueba ? (
          <>
            <div className="bg-fiora-dark-bg border border-gray-600 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-white text-lg">{productoPrueba.nombre}</p>
                  <p className="text-sm text-gray-400">Código: <span className="text-fiora-gold font-mono">{productoPrueba.codigo}</span></p>
                  
                  {(() => {
                    try {
                      const imagenes = JSON.parse(productoPrueba.imagenes || '[]') as ImagenData[]
                      if (!Array.isArray(imagenes) || imagenes.length === 0) {
                        return <p className="text-xs text-red-400 mt-2">⚠️ No hay imágenes en este producto</p>
                      }
                      
                      const urlImagen = imagenes[0]?.url
                      if (!urlImagen) {
                        return <p className="text-xs text-red-400 mt-2">⚠️ URL de imagen vacía</p>
                      }

                      return (
                        <>
                          <p className="text-xs text-gray-500 mt-2 font-mono truncate break-all">
                            {urlImagen}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Total de imágenes en este producto: <strong>{imagenes.length}</strong>
                          </p>
                        </>
                      )
                    } catch (e) {
                      return <p className="text-xs text-red-400 mt-2">⚠️ Error parseando imágenes JSON</p>
                    }
                  })()}
                </div>

                {(() => {
                  try {
                    const imagenes = JSON.parse(productoPrueba.imagenes || '[]') as ImagenData[]
                    const urlImagen = imagenes[0]?.url
                    
                    if (!urlImagen) {
                      return null
                    }

                    return (
                      <a
                        href={urlImagen}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-700 rounded transition shrink-0"
                        title="Ver imagen en nueva pestaña"
                      >
                        <Download className="w-5 h-5 text-gray-400" />
                      </a>
                    )
                  } catch (e) {
                    return null
                  }
                })()}
              </div>
            </div>

            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
              <p className="text-sm text-blue-200">
                📋 Esta imagen será descargada de Cloudinary, guardada localmente en:<br/>
                <code className="text-xs text-blue-100 font-mono">
                  /uploads/productos/{productoPrueba.codigo}/imagen_0.jpg
                </code>
              </p>
            </div>

            <Button
              onClick={migrarProductoPrueba}
              disabled={migrando || pruebaPasada}
              className="w-full bg-fiora-gold hover:bg-fiora-gold/80 text-black font-bold py-3 text-lg"
            >
              {migrando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Migrando prueba...
                </>
              ) : pruebaPasada ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  ✅ Prueba completada
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Ejecutar Prueba Piloto
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="text-center text-gray-400">
            No hay productos con imágenes de Cloudinary para migrar
          </div>
        )}
      </div>

      {/* Resultado de prueba */}
      {resultado && !migracionCompleta && (
        <>
          {resultado.error ? (
            <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-8">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-400">❌ Error en la prueba</p>
                  <p className="text-sm text-gray-300 mt-1">{resultado.error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 mb-8">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-400">✅ Prueba exitosa</p>
                  <p className="text-sm text-gray-300 mt-2">
                    Imagen descargada y actualizada en BD
                  </p>
                  <div className="mt-3 text-xs text-gray-400 font-mono space-y-1">
                    <p>
                      <strong>Antes:</strong> {resultado.producto?.imagenAnterior?.substring(0, 50)}...
                    </p>
                    <p>
                      <strong>Ahora:</strong> {resultado.producto?.imagenNueva}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* PASO 2: MIGRACIÓN COMPLETA */}
      {pruebaPasada && (
        <div className="bg-fiora-dark-bg border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-500 text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h2 className="text-2xl font-bold">Migración Completa</h2>
          </div>

          <div className="mb-4 p-4 bg-green-900/20 border border-green-500 rounded-lg">
            <p className="text-sm text-green-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              La prueba piloto fue exitosa. Ahora puedes migrar TODOS los productos.
            </p>
          </div>

          <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
            <p className="text-sm text-yellow-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Esto migrará TODAS las imágenes de Cloudinary de TODOS los productos. 
                El proceso puede tardar dependiendo de la cantidad de imágenes.
              </span>
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg mb-4 text-sm text-gray-300">
            <p className="font-semibold mb-2">Estructura final:</p>
            <code className="text-xs text-fiora-gold font-mono block mb-2">
              /uploads/productos/[CODIGO]/imagen_0.jpg<br/>
              /uploads/productos/[CODIGO]/imagen_1.jpg<br/>
              /uploads/productos/[CODIGO]/imagen_2.jpg
            </code>
          </div>

          <Button
            onClick={iniciarMigracionCompleta}
            disabled={migracionCompleta}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg"
          >
            {migracionCompleta ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Migrando todos los productos...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Iniciar Migración Completa
              </>
            )}
          </Button>
        </div>
      )}

      {/* Resultado migración completa */}
      {resultado && migracionCompleta && (
        <>
          {resultado.error ? (
            <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mt-8">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-400">❌ Error en migración completa</p>
                  <p className="text-sm text-gray-300 mt-1">{resultado.error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 mt-8">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-400">✅ Migración completa finalizada</p>
                  <div className="mt-3 text-sm text-gray-300 space-y-1">
                    <p>📊 <strong>Imágenes migradas:</strong> {resultado.migratedCount}</p>
                    <p>⏱️ <strong>Tiempo:</strong> {resultado.duration}ms</p>
                    {resultado.errors > 0 && (
                      <p>⚠️ <strong>Errores:</strong> {resultado.errors}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
