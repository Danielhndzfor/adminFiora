'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Check, AlertCircle, Download, Trash2 } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [migrando, setMigrando] = useState<number | null>(null)
  const [resultado, setResultado] = useState<any>(null)

  // Cargar productos con imágenes de Cloudinary
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetch('/api/products', {
          credentials: 'include',
        })

        if (!response.ok) {
          toast.error('Error cargando productos')
          return
        }

        const data = await response.json()
        const productosConImagenes = data.productos.filter((p: Producto) => {
          const imagenes = JSON.parse(p.imagenes || '[]') as ImagenData[]
          return imagenes.length > 0 && imagenes[0].url?.startsWith('https://res.cloudinary.com')
        })

        setProductos(productosConImagenes)
      } catch (error) {
        toast.error('Error cargando productos')
      } finally {
        setLoading(false)
      }
    }

    cargarProductos()
  }, [])

  const migrarProducto = async (productoId: number) => {
    setMigrando(productoId)
    setResultado(null)

    try {
      const response = await fetch('/api/migrate/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productoId }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Error migrando imagen')
        setResultado({
          error: data.error,
          productoId,
        })
        return
      }

      setResultado(data)
      toast.success('✅ Imagen migrada exitosamente')

      // Remover de la lista
      setProductos(productos.filter((p) => p.id !== productoId))
    } catch (error) {
      toast.error('Error en la migración')
      setResultado({
        error: error instanceof Error ? error.message : 'Error desconocido',
        productoId,
      })
    } finally {
      setMigrando(null)
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
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🖼️ Migración de Imágenes</h1>
        <p className="text-gray-400">
          Migrar imágenes de Cloudinary al almacenamiento local del VPS
        </p>
      </div>

      {/* Resumen */}
      <div className="bg-fiora-dark-bg border border-fiora-gold rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📊 Estado</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400">Productos pendientes</p>
            <p className="text-2xl font-bold text-fiora-gold">{productos.length}</p>
          </div>
          <div>
            <p className="text-gray-400">Estructura</p>
            <p className="text-sm text-gray-300 font-mono">
              /uploads/productos/[CODIGO]/imagen_0.jpg
            </p>
          </div>
        </div>
      </div>

      {/* Resultado anterior */}
      {resultado && !resultado.error && (
        <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 mb-6">
          <div className="flex gap-2 mb-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-400">✅ Migración exitosa</p>
              <p className="text-sm text-gray-300 mt-1">{resultado.producto.nombre}</p>
              <div className="mt-2 text-xs text-gray-400 font-mono">
                <p>Antes: {resultado.producto.imagenAnterior?.substring(0, 50)}...</p>
                <p>Ahora: {resultado.producto.imagenNueva}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {resultado?.error && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-400">❌ Error</p>
              <p className="text-sm text-gray-300 mt-1">{resultado.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      <div className="space-y-3">
        {productos.length === 0 ? (
          <div className="bg-fiora-dark-bg border border-gray-600 rounded-lg p-6 text-center">
            <p className="text-gray-400">
              {loading ? 'Cargando...' : '✅ No hay más productos para migrar'}
            </p>
          </div>
        ) : (
          productos.map((producto) => {
            const imagenes = JSON.parse(producto.imagenes || '[]') as ImagenData[]
            const primeraImagen = imagenes[0]

            return (
              <div
                key={producto.id}
                className="bg-fiora-dark-bg border border-gray-600 rounded-lg p-4 hover:border-fiora-gold transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{producto.nombre}</p>
                    <p className="text-sm text-gray-400">Código: {producto.codigo}</p>
                    <p className="text-xs text-gray-500 mt-2 font-mono truncate">
                      {primeraImagen.url?.substring(0, 60)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Total de imágenes: {imagenes.length}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={primeraImagen.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-700 rounded transition"
                      title="Ver imagen"
                    >
                      <Download className="w-5 h-5 text-gray-400" />
                    </a>

                    <Button
                      onClick={() => migrarProducto(producto.id)}
                      disabled={migrando === producto.id}
                      className="bg-fiora-gold hover:bg-fiora-gold/80 text-black font-semibold"
                    >
                      {migrando === producto.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Migrando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Probar migración
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Instrucciones */}
      <div className="mt-8 bg-fiora-dark-bg border border-gray-600 rounded-lg p-4">
        <h3 className="font-semibold mb-2">📋 Instrucciones</h3>
        <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
          <li>Haz clic en "Probar migración" para migrar la primera imagen de un producto</li>
          <li>La imagen se descargará de Cloudinary y se guardará en el VPS</li>
          <li>La base de datos se actualizará con la nueva URL local</li>
          <li>Estructura: <code className="text-xs text-fiora-gold">/uploads/productos/CODIGO/imagen_0.jpg</code></li>
        </ol>
      </div>
    </div>
  )
}
