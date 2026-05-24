'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { X, Trash2, Copy, Loader2, Tag, Plus, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { parseImagenesJSON } from '@/lib/image-handler-client'
import { fetchCategorias } from '@/lib/categories'

/**
 * Invalida el caché del PWA para endpoints de productos e imágenes
 * Importante para asegurar que los cambios se reflejen inmediatamente
 */
async function invalidatePWACache() {
  if (!('caches' in window)) return // No hay soporte de caché
  
  try {
    const cacheNames = await caches.keys()
    const urlPatterns = [
      '/api/products/',
      '/api/upload',
      'https://fiora.mascontrol.app/uploads/products/'
    ]
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      
      for (const request of requests) {
        const url = request.url
        // Si la URL contiene alguno de los patrones, eliminar del caché
        if (urlPatterns.some(pattern => url.includes(pattern))) {
          await cache.delete(request)
        }
      }
    }
    
    console.log('✓ Caché PWA invalidado')
  } catch (err) {
    console.warn('No se pudo invalidar caché PWA:', err)
  }
}

interface ProductoImagen {
  url: string
  nombreArchivo: string
  orden: number
  creadoEn: string
}

interface Product {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  palabrasClave?: string
  precio: number | string
  costo?: number | string
  stock: number
  imagenes?: string
  activo: boolean
  categoriaId: number
  categoria?: { id: number; nombre: string }
}

interface Category {
  id: number
  nombre: string
}

interface EditProductModalProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const MAX_IMAGES = 5

export function EditProductModal({ product, open, onOpenChange, onSuccess }: EditProductModalProps) {
  const [nombre, setNombre] = useState(product.nombre || '')
  const [descripcion, setDescripcion] = useState(product.descripcion || '')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>(
    product.palabrasClave ? product.palabrasClave.split(', ').filter((k) => k.trim()) : []
  )
  const [precio, setPrecio] = useState(product.precio ? String(product.precio) : '')
  const [costo, setCosto] = useState(product.costo ? String(product.costo) : '')
  const [stock, setStock] = useState(product.stock ? String(product.stock) : '0')
  const [activo, setActivo] = useState(product.activo !== undefined ? product.activo : true)
  const [categoriaId, setCategoriaId] = useState(product.categoriaId ? String(product.categoriaId) : '')
  const [categorias, setCategorias] = useState<Category[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(true)

  // ImÃ¡genes ya guardadas en VPS
  const [imagenesGuardadas, setImagenesGuardadas] = useState<ProductoImagen[]>(
    parseImagenesJSON(product.imagenes || null)
  )
  // ImÃ¡genes nuevas pendientes de subir (base64)
  const [imagenesPendientes, setImagenesPendientes] = useState<string[]>([])
  // URL a eliminar (confirmaciÃ³n)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingDeleteImg, setLoadingDeleteImg] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true
    fetchCategorias()
      .then((data) => { if (mounted) setCategorias(data) })
      .catch(() => toast.error('Error cargando categorÃ­as'))
      .finally(() => { if (mounted) setLoadingCategorias(false) })
    return () => { mounted = false }
  }, [])

  // Refetch datos frescos cuando se abre el modal
  useEffect(() => {
    if (!open || !product.id) return
    
    const refetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${product.id}?t=${Date.now()}`, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' }
        })
        if (res.ok) {
          const productoActualizado = await res.json()
          // Actualizar solo las imágenes (que pueden haber cambiado)
          const nuevasImagenes = parseImagenesJSON(productoActualizado.imagenes || null)
          setImagenesGuardadas(nuevasImagenes)
        }
      } catch (err) {
        console.warn('Error refetcheando producto:', err)
      }
    }

    refetchProduct()
  }, [open, product.id])

  const totalImagenes = imagenesGuardadas.length + imagenesPendientes.length

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const disponibles = MAX_IMAGES - totalImagenes
    if (disponibles <= 0) { toast.error(`MÃ¡ximo ${MAX_IMAGES} imÃ¡genes`); return }
    const seleccionados = files.slice(0, disponibles)
    if (files.length > disponibles) toast.warning(`Solo se agregarÃ¡n ${disponibles} imagen(es)`)

    seleccionados.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`"${file.name}" supera 10MB`); return }
      const reader = new FileReader()
      reader.onload = (ev) => setImagenesPendientes((prev) => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePendiente = (index: number) => {
    setImagenesPendientes((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDeleteGuardada = async (url: string) => {
    // Validación: No permitir eliminar la última imagen
    if (imagenesGuardadas.length === 1) {
      toast.error('Debe mantener al menos una imagen. Sube otra antes de eliminar esta.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/upload', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productoId: product.id, imageUrl: url }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }

      // Invalidar caché PWA después de eliminar del VPS
      await invalidatePWACache()

      // Refetch el producto para obtener las imágenes actualizadas con URLs renumeradas
      try {
        // Agregar timestamp para forzar refetch de imágenes (bypass caché navegador)
        const timestamp = Date.now()
        const refetchRes = await fetch(`/api/products/${product.id}?t=${timestamp}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache' // Forzar no cachear
          },
        })
        if (refetchRes.ok) {
          const productoActualizado = await refetchRes.json()
          const nuevasImagenes = parseImagenesJSON(productoActualizado.imagenes || null)
          // Agregar timestamp a cada URL para forzar refetch de imágenes físicas
          const imagenesConTimestamp = nuevasImagenes.map(img => ({
            ...img,
            url: img.url.includes('?') ? img.url : `${img.url}?v=${timestamp}`
          }))
          setImagenesGuardadas(imagenesConTimestamp)
        } else {
          // Fallback: actualizar localmente filtrando por URL (incluyendo timestamp)
          const timestamp = Date.now()
          setImagenesGuardadas((prev) => 
            prev
              .filter((img) => !img.url.includes(url.split('?')[0]))
              .map((img, i) => ({
                ...img,
                url: img.url.includes('?') ? img.url.split('?')[0] : img.url,
                orden: i + 1
              }))
              .map((img) => ({
                ...img,
                url: `${img.url}?v=${timestamp}`
              }))
          )
        }
      } catch (refetchErr) {
        console.warn('No se pudo refetch después de eliminar:', refetchErr)
        // Fallback: actualizar localmente con timestamp
        const timestamp = Date.now()
        setImagenesGuardadas((prev) => 
          prev
            .filter((img) => !img.url.includes(url.split('?')[0]))
            .map((img, i) => ({
              ...img,
              url: img.url.includes('?') ? img.url.split('?')[0] : img.url,
              orden: i + 1
            }))
            .map((img) => ({
              ...img,
              url: `${img.url}?v=${timestamp}`
            }))
        )
      }

      toast.success('Imagen eliminada y cambios sincronizados')
      
      // Llamar onSuccess para refrescar las cards con los cambios
      onSuccess?.()
      
      // Cerrar el modal después de un pequeño delay para que el usuario vea el cambio
      setTimeout(() => {
        setDeletingUrl(null)
      }, 300)
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar imagen')
    } finally {
      setLoading(false)
    }
  }

  const addKeyword = () => {
    const trimmed = keywordInput.trim()
    if (!trimmed) return
    if (keywords.includes(trimmed.toLowerCase())) { toast.error('Ya existe'); return }
    setKeywords([...keywords, trimmed.toLowerCase()])
    setKeywordInput('')
  }

  const removeKeyword = (index: number) => setKeywords(keywords.filter((_, i) => i !== index))

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addKeyword() }
  }

  const doUpdateProduct = async () => {
    setLoading(true)
    setShowUpdateConfirm(false)
    try {
      // 1. Actualizar datos del producto
      const body: any = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        palabrasClave: keywords.join(', ') || undefined,
        precio: parseFloat(precio),
        costo: costo ? parseFloat(costo) : undefined,
        stock: parseInt(stock) || 0,
        activo,
        categoriaId: parseInt(categoriaId),
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar')
      }

      // 2. Subir imágenes nuevas al VPS
      let imagenSubidaExitosa = false
      for (const base64 of imagenesPendientes) {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productoId: product.id, imagenBase64: base64 }),
        })
        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          console.warn('Error subiendo imagen:', err.error)
        } else {
          imagenSubidaExitosa = true
        }
      }

      // 3. Si se subieron imágenes, refetch el producto para obtener las URLs nuevas
      if (imagenSubidaExitosa && imagenesPendientes.length > 0) {
        try {
          // Invalidar caché PWA primero
          await invalidatePWACache()
          
          // Agregar timestamp para forzar refetch de imágenes (bypass caché navegador)
          const timestamp = Date.now()
          const refetchRes = await fetch(`/api/products/${product.id}?t=${timestamp}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache' // Forzar no cachear
            },
          })
          if (refetchRes.ok) {
            const productoActualizado = await refetchRes.json()
            // Actualizar estado local con las nuevas imágenes del VPS
            const nuevasImagenes = parseImagenesJSON(productoActualizado.imagenes || null)
            // Agregar timestamp a cada URL para forzar refetch de imágenes físicas
            const imagenesConTimestamp = nuevasImagenes.map(img => ({
              ...img,
              url: img.url.includes('?') ? img.url : `${img.url}?v=${timestamp}`
            }))
            setImagenesGuardadas(imagenesConTimestamp)
            setImagenesPendientes([]) // Limpiar pendientes
          }
        } catch (refetchErr) {
          console.warn('No se pudo refetch el producto:', refetchErr)
          // Aún así mostrar éxito, el usuario puede recargar si lo necesita
        }
      } else {
        // Si no hay imágenes pendientes, solo limpiar
        setImagenesPendientes([])
      }

      toast.success('Producto actualizado y cambios sincronizados')
      
      // Llamar onSuccess para refrescar las cards
      onSuccess?.()
      
      // Cerrar modal después de un pequeño delay
      setTimeout(() => {
        onOpenChange(false)
      }, 300)
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar producto')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return toast.error('El nombre es obligatorio')
    if (!descripcion.trim()) return toast.error('La descripciÃ³n es obligatoria')
    if (!categoriaId) return toast.error('Selecciona una categorÃ­a')
    if (!precio || parseFloat(precio) <= 0) return toast.error('Ingresa un precio vÃ¡lido')
    if (parseInt(stock) < 0) return toast.error('El stock debe ser 0 o mayor')
    if (keywords.length === 0) return toast.error('Agrega al menos una palabra clave')
    setShowUpdateConfirm(true)
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success('Producto desactivado')
      
      // Invalidar caché PWA para que se recargue la lista de productos
      await invalidatePWACache()
      
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al desactivar')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => { navigator.clipboard.writeText(product.codigo); toast.success('CÃ³digo copiado') }

  if (!open) return null

  // ConfirmaciÃ³n de eliminar imagen
  if (deletingUrl) {
    return (
      <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-150">
        <div className="w-full sm:max-w-sm mx-0 sm:mx-4 sm:rounded-2xl rounded-t-3xl bg-[#feffff] animate-in zoom-in-95 duration-200">
          <div className="p-6 text-center">
            {loading ? (
              <>
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-lg font-bold text-[#092B2B] mb-2">Sincronizando cambios</h2>
                <p className="text-[#092B2B]/70 text-sm mb-6">Eliminando imagen y actualizando vista...</p>
              </>
            ) : (
              <>
                <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-7 w-7 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-[#092B2B] mb-2">Eliminar imagen</h2>
                <p className="text-[#092B2B]/70 text-sm mb-6">¿Eliminar esta imagen? Esta acción no se puede deshacer.</p>
              </>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeletingUrl(null)} disabled={loading}>Cancelar</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteGuardada(deletingUrl)} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                {loading ? 'Sincronizando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showUpdateConfirm) {
    return (
      <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-150">
        <div className="w-full sm:max-w-sm mx-0 sm:mx-4 sm:rounded-2xl rounded-t-3xl bg-[#feffff] animate-in zoom-in-95 duration-200">
          <div className="p-6 text-center">
            {loading ? (
              <>
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-lg font-bold text-[#092B2B] mb-2">Sincronizando cambios</h2>
                <p className="text-[#092B2B]/70 text-sm mb-6">
                  Actualizando producto{imagenesPendientes.length > 0 && ` y subiendo ${imagenesPendientes.length} imagen(es)`}...
                </p>
              </>
            ) : (
              <>
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Copy className="h-7 w-7 text-[#092B2B]" />
                </div>
                <h2 className="text-lg font-bold text-[#092B2B] mb-2">Actualizar producto</h2>
                <p className="text-[#092B2B]/70 text-sm mb-6">
                  ¿Guardar cambios en <strong>«{nombre.trim()}»</strong>?
                  {imagenesPendientes.length > 0 && ` Se subirán ${imagenesPendientes.length} imagen(es) nueva(s).`}
                </p>
              </>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-[#092B2B]/20 text-[#092B2B]" onClick={() => setShowUpdateConfirm(false)} disabled={loading}>Cancelar</Button>
              <Button className="flex-1 bg-[#092B2B] hover:bg-[#092B2B]/90 text-white" onClick={doUpdateProduct} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {loading ? 'Sincronizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-150">
        <div className="w-full sm:max-w-sm mx-0 sm:mx-4 sm:rounded-2xl rounded-t-3xl bg-[#feffff] animate-in zoom-in-95 duration-200">
          <div className="p-6 text-center">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-[#092B2B] mb-2">Desactivar producto</h2>
            <p className="text-[#092B2B]/70 text-sm mb-6">¿Desactivar <strong>{product.nombre}</strong>? Podrás reactivarlo después.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-[#092B2B]/20 text-[#092B2B]" onClick={() => setShowDeleteConfirm(false)} disabled={loading}>Cancelar</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Desactivar
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-lg mx-0 sm:mx-4 max-h-[85vh] sm:rounded-2xl rounded-t-3xl overflow-hidden bg-[#feffff] flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl">
        {/* Header */}
        <div className="bg-[#092B2B] px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Editar Producto</h2>
            <button onClick={copyCode} className="text-sm text-white/70 flex items-center gap-1 hover:text-white transition-colors mt-1">
              <span className="font-mono font-semibold">{product.codigo}</span>
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} disabled={loading} className="text-white hover:bg-[#092B2B]/60">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 sm:pb-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">

            {/* Imágenes */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#092B2B]">
                Imágenes <span className="text-[#092B2B]/50 font-normal">({totalImagenes}/{MAX_IMAGES})</span>
              </Label>

              <div className="grid grid-cols-3 gap-2">
                {/* Imágenes ya en VPS */}
                {imagenesGuardadas.map((img, idx) => (
                  <div key={`${img.url}-${img.orden}`} className="relative aspect-square rounded-xl overflow-hidden bg-[#092B2B]/5 border border-[#092B2B]/10">
                    <img src={img.url} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-[#092B2B] text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Principal</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeletingUrl(img.url)}
                      disabled={loadingDeleteImg || imagenesGuardadas.length === 1}
                      title={imagenesGuardadas.length === 1 ? 'Sube otra imagen primero' : 'Eliminar imagen'}
                      className={`absolute top-1 right-1 rounded-full p-0.5 text-white ${
                        imagenesGuardadas.length === 1 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Imágenes pendientes (aún no subidas) */}
                {imagenesPendientes.map((src, idx) => (
                  <div key={`pending-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-amber-50 border-2 border-dashed border-amber-400">
                    <img src={src} alt={`Nueva ${idx + 1}`} className="w-full h-full object-cover opacity-80" />
                    <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Nueva</span>
                    <button
                      type="button"
                      onClick={() => removePendiente(idx)}
                      className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Botón agregar */}
                {totalImagenes < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#092B2B]/30 hover:border-[#092B2B]/60 hover:bg-[#092B2B]/5 transition-all flex flex-col items-center justify-center gap-1 text-[#092B2B]/50 hover:text-[#092B2B]"
                  >
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Agregar</span>
                  </button>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} disabled={loading} />
              <p className="text-xs text-[#092B2B]/50">Las imágenes nuevas se subirán al guardar. Máx 10MB c/u.</p>
            </div>

            {/* Información Básica */}
            <div className="space-y-3 bg-[#092B2B]/5 p-4 rounded-xl border border-[#092B2B]/10">
              <h3 className="font-semibold text-[#092B2B] text-sm">Información Básica</h3>
              <div>
                <Label htmlFor="nombre" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Nombre *</Label>
                <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-2 border-[#092B2B]/20" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="descripcion" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Descripción</Label>
                <Input id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="mt-2 border-[#092B2B]/20" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="categoria" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Categoría *</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId} disabled={loading || loadingCategorias}>
                  <SelectTrigger className="mt-2 w-full border-[#092B2B]/20">
                    <SelectValue placeholder={loadingCategorias ? 'Cargando...' : 'Selecciona una categoría'} />
                  </SelectTrigger>
                  <SelectContent className="relative z-9999">
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#092B2B]/10">
                <Label htmlFor="activo" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Estado</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${activo ? 'text-[#092B2B]' : 'text-red-600'}`}>{activo ? 'Activo' : 'Inactivo'}</span>
                  <Switch id="activo" checked={activo} onCheckedChange={setActivo} disabled={loading} />
                </div>
              </div>
            </div>

            {/* Precios */}
            <div className="space-y-3 bg-[#BFA274]/10 p-4 rounded-xl border border-[#BFA274]/20">
              <h3 className="font-semibold text-[#092B2B] text-sm">Precios e Inventario</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="precio" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Precio Venta *</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#092B2B]/60 font-semibold">$</span>
                    <Input id="precio" type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} className="pl-8 border-[#BFA274]/20" disabled={loading} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="costo" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Costo</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#092B2B]/60 font-semibold">$</span>
                    <Input id="costo" type="number" step="0.01" value={costo} onChange={(e) => setCosto(e.target.value)} className="pl-8 border-[#BFA274]/20" disabled={loading} />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="stock" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Stock</Label>
                <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-2 border-[#BFA274]/20" disabled={loading} />
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-3 bg-[#BFA274]/10 p-4 rounded-xl border border-[#BFA274]/20">
              <h3 className="font-semibold text-[#092B2B] text-sm flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#BFA274]" />
                Palabras Clave
              </h3>
              <div className="flex gap-2">
                <Input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={handleKeywordKeyDown} placeholder="plata, brillante, vintage..." className="border-[#BFA274]/20 flex-1" disabled={loading} />
                <Button type="button" variant="outline" size="icon" onClick={addKeyword} disabled={loading || !keywordInput.trim()} className="bg-[#092B2B] hover:bg-[#092B2B]/90 border-[#092B2B] text-white shrink-0 h-9 w-9">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((keyword, idx) => (
                    <div key={idx} className="bg-[#BFA274]/30 text-[#092B2B] px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                      {keyword}
                      <button type="button" onClick={() => removeKeyword(idx)} className="opacity-60 hover:opacity-100"><X className="h-2.5 w-2.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <Button type="button" variant="outline" className="flex-1 border-red-200/50 text-red-600 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-2" />Desactivar
              </Button>
              <Button type="submit" className="flex-1 bg-[#092B2B] hover:bg-[#092B2B]/90 text-white font-bold rounded-xl" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
