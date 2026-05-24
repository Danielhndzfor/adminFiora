'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, RefreshCw, Loader2, Tag, Plus, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
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

interface AddProductModalProps {
    onClose: () => void
    onSuccess?: () => void
}

interface Category {
    id: number
    nombre: string
}

const MAX_IMAGES = 5

export function AddProductModal({ onClose, onSuccess }: AddProductModalProps) {
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [keywordInput, setKeywordInput] = useState('')
    const [keywords, setKeywords] = useState<string[]>([])
    const [precio, setPrecio] = useState('')
    const [costo, setCosto] = useState('')
    const [stock, setStock] = useState('1')
    const [categoriaId, setCategoriaId] = useState<string>('')
    const [categorias, setCategorias] = useState<Category[]>([])
    const [imagenesPendientes, setImagenesPendientes] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingCategorias, setLoadingCategorias] = useState(true)
    const [showConfirm, setShowConfirm] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        let mounted = true
        fetchCategorias()
            .then((data) => { if (mounted) setCategorias(data) })
            .catch(() => toast.error('Error cargando categorÃ­as'))
            .finally(() => { if (mounted) setLoadingCategorias(false) })
        return () => { mounted = false }
    }, [])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const disponibles = MAX_IMAGES - imagenesPendientes.length
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

    const removeImagen = (index: number) => setImagenesPendientes((prev) => prev.filter((_, i) => i !== index))

    const addKeyword = () => {
        const trimmed = keywordInput.trim()
        if (!trimmed) return
        if (keywords.includes(trimmed.toLowerCase())) { toast.error('Esta palabra clave ya existe'); return }
        setKeywords([...keywords, trimmed.toLowerCase()])
        setKeywordInput('')
    }

    const removeKeyword = (index: number) => setKeywords(keywords.filter((_, i) => i !== index))

    const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); addKeyword() }
    }

    const doCreateProduct = async () => {
        setLoading(true)
        setShowConfirm(false)
        try {
            // 1. Crear producto
            const response = await fetch('/api/products', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim() || undefined,
                    palabrasClave: keywords.join(', ') || undefined,
                    precio: parseFloat(precio),
                    costo: costo ? parseFloat(costo) : undefined,
                    stock: parseInt(stock) || 1,
                    categoriaId: parseInt(categoriaId),
                }),
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al crear producto')
            }
            const producto = await response.json()

            // 2. Subir imágenes una a una
            let imagenesSubidas = 0
            for (let i = 0; i < imagenesPendientes.length; i++) {
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productoId: producto.id, imagenBase64: imagenesPendientes[i] }),
                })
                if (!uploadRes.ok) {
                    const err = await uploadRes.json()
                    console.warn(`Error subiendo imagen ${i + 1}:`, err.error)
                } else {
                    imagenesSubidas++
                }
            }

            // 3. Invalidar caché PWA después de subir imágenes
            if (imagenesPendientes.length > 0) {
                await invalidatePWACache()
            }

            // 4. Si hay imágenes pendientes, mostrar si algunas tuvieron éxito
            if (imagenesPendientes.length > 0) {
                if (imagenesSubidas === imagenesPendientes.length) {
                    toast.success(`Producto creado con ${imagenesSubidas} imagen(es)`)
                } else if (imagenesSubidas > 0) {
                    toast.warning(`Producto creado pero solo ${imagenesSubidas} de ${imagenesPendientes.length} imágenes se subieron`)
                } else {
                    toast.warning('Producto creado pero las imágenes no se subieron')
                }
            } else {
                toast.success('Producto creado con éxito')
            }

            onSuccess?.()
            onClose()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al crear producto')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!nombre.trim()) return toast.error('El nombre es obligatorio')
        if (!descripcion.trim()) return toast.error('La descripción es obligatoria')
        if (!categoriaId) return toast.error('Selecciona una categoría')
        if (!precio || parseFloat(precio) <= 0) return toast.error('Ingresa un precio válido')
        if (!stock || parseInt(stock) < 0) return toast.error('El stock debe ser 0 o mayor')
        if (keywords.length === 0) return toast.error('Agrega al menos una palabra clave')
        setShowConfirm(true)
    }

    if (showConfirm) {
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
                                    Creando producto{imagenesPendientes.length > 0 && ` y subiendo ${imagenesPendientes.length} imagen(es)`}...
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                                    <Plus className="h-7 w-7 text-[#092B2B]" />
                                </div>
                                <h2 className="text-lg font-bold text-[#092B2B] mb-2">Crear producto</h2>
                                <p className="text-[#092B2B]/70 text-sm mb-6">
                                    ¿Deseas crear <strong className="text-[#092B2B]">«{nombre.trim()}»</strong>?
                                    {imagenesPendientes.length > 0
                                        ? ` Se subirán ${imagenesPendientes.length} imagen(es).`
                                        : ' Sin imágenes por ahora.'}
                                </p>
                            </>
                        )}
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 border-[#092B2B]/20 text-[#092B2B]" onClick={() => setShowConfirm(false)} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button className="flex-1 bg-[#092B2B] hover:bg-[#092B2B]/90 text-white" onClick={doCreateProduct} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                {loading ? 'Sincronizando...' : 'Crear'}
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
                        <h2 className="text-xl font-bold text-white">Nuevo Producto</h2>
                        <p className="text-sm text-white/70 flex items-center gap-1 mt-1">
                            <RefreshCw className="h-3 w-3" />
                            Código generado automáticamente
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} disabled={loading} className="text-white hover:bg-[#092B2B]/60">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto pb-20 sm:pb-4">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">

                        {/* Imágenes */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-[#092B2B]">
                                Imágenes{' '}
                                <span className="font-normal text-[#092B2B]/50">({imagenesPendientes.length}/{MAX_IMAGES})</span>
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                                {imagenesPendientes.map((src, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-[#092B2B]/5 border border-[#092B2B]/10">
                                        <img src={src} alt={`img-${idx}`} className="w-full h-full object-cover" />
                                        {idx === 0 && (
                                            <span className="absolute top-1 left-1 bg-[#092B2B] text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                                                Principal
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImagen(idx)}
                                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-0.5 text-white"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {imagenesPendientes.length < MAX_IMAGES && (
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
                            <p className="text-xs text-[#092B2B]/50">Se comprimirán automáticamente a WebP. Máx 10MB c/u.</p>
                        </div>

                        {/* Información básica */}
                        <div className="space-y-3 bg-[#092B2B]/5 p-4 rounded-xl border border-[#092B2B]/10">
                            <h3 className="font-semibold text-[#092B2B] text-sm">Información Básica</h3>
                            <div>
                                <Label htmlFor="nombre" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Nombre *</Label>
                                <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Anillo de plata" className="mt-2 border-[#092B2B]/20 focus:border-[#092B2B]" disabled={loading} autoFocus />
                            </div>
                            <div>
                                <Label htmlFor="descripcion" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Descripción</Label>
                                <Input id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalles, material, características..." className="mt-2 border-[#092B2B]/20 focus:border-[#092B2B]" disabled={loading} />
                            </div>
                            <div>
                                <Label htmlFor="categoria" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Categoría *</Label>
                                <Select value={categoriaId} onValueChange={setCategoriaId} disabled={loading || loadingCategorias}>
                                    <SelectTrigger className="mt-2 border-[#092B2B]/20">
                                        <SelectValue placeholder={loadingCategorias ? 'Cargando...' : 'Selecciona una categoría'} />
                                    </SelectTrigger>
                                    <SelectContent className="relative z-9999">
                                        {categorias.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                        <Input id="precio" type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0" className="pl-8 border-[#BFA274]/20" disabled={loading} />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="costo" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Costo</Label>
                                    <div className="relative mt-2">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#092B2B]/60 font-semibold">$</span>
                                        <Input id="costo" type="number" step="0.01" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="0" className="pl-8 border-[#BFA274]/20" disabled={loading} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="stock" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Stock Inicial</Label>
                                <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="1" className="mt-2 border-[#BFA274]/20" disabled={loading} />
                            </div>
                        </div>

                        {/* Palabras clave */}
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
                                            <button type="button" onClick={() => removeKeyword(idx)} className="opacity-60 hover:opacity-100">
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full h-12 mt-2 bg-[#092B2B] hover:bg-[#092B2B]/90 text-white font-bold text-lg rounded-xl" disabled={loading}>
                            {loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Creando...</> : 'Crear producto'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

