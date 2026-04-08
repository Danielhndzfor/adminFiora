'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { X, Trash2, Copy, Camera, Loader2, Tag, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  palabrasClave?: string
  precio: number | string
  costo?: number | string
  stock: number
  imagen?: string
  activo: boolean
  categoriaId: number
  categoria?: {
    id: number
    nombre: string
  }
}

interface Category {
  id: number
  nombre: string
}

import { fetchCategorias } from '@/lib/categories'

interface EditProductModalProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditProductModal({ product, open, onOpenChange, onSuccess }: EditProductModalProps) {
  const [nombre, setNombre] = useState(product.nombre)
  const [descripcion, setDescripcion] = useState(product.descripcion || '')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>(
    product.palabrasClave ? product.palabrasClave.split(', ').filter(k => k.trim()) : []
  )
  const [precio, setPrecio] = useState(product.precio.toString())
  const [costo, setCosto] = useState(product.costo?.toString() || '')
  const [stock, setStock] = useState(product.stock.toString())
  const [activo, setActivo] = useState(product.activo)
  const [categoriaId, setCategoriaId] = useState(product.categoriaId.toString())
  const [categorias, setCategorias] = useState<Category[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(product.imagen || null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar categorías (cacheadas) al montar
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoadingCategorias(true)
        const data = await fetchCategorias()
        if (mounted) setCategorias(data)
      } catch (err) {
        toast.error('Error cargando categorías')
      } finally {
        if (mounted) setLoadingCategorias(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setImageBase64(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const addKeyword = () => {
    const trimmed = keywordInput.trim()
    if (!trimmed) return
    if (keywords.includes(trimmed.toLowerCase())) {
      toast.error('Esta palabra clave ya existe')
      return
    }
    setKeywords([...keywords, trimmed.toLowerCase()])
    setKeywordInput('')
  }

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    }
  }

  const doUpdateProduct = async () => {
    setLoading(true)
    setShowUpdateConfirm(false)

    try {
      const body: any = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        palabrasClave: keywords.join(', ') || undefined,
        precio: parseFloat(precio),
        costo: costo ? parseFloat(costo) : undefined,
        stock: parseInt(stock) || 0,
        activo,
      }

      if (imageBase64) {
        body.imagenBase64 = imageBase64
      }

      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar producto')
      }

      toast.success('Producto actualizado con éxito')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar producto')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      toast.error('Ingresa el nombre del producto')
      return
    }

    if (!precio || parseFloat(precio) <= 0) {
      toast.error('Ingresa un precio válido')
      return
    }

    setShowUpdateConfirm(true)
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al desactivar producto')
      }

      toast.success('Producto desactivado')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al desactivar producto')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(product.codigo)
    toast.success('Código copiado')
  }

  if (!open) return null

  if (showUpdateConfirm) {
    return (
      <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-150">
        <div className="w-full sm:max-w-sm mx-0 sm:mx-4 sm:rounded-2xl rounded-t-3xl bg-[#feffff] animate-in zoom-in-95 duration-200">
          <div className="p-6 text-center">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Copy className="h-7 w-7 text-[#092B2B]" />
            </div>
            <h2 className="text-lg font-bold text-[#092B2B] mb-2">Actualizar producto</h2>
            <p className="text-[#092B2B]/70 text-sm mb-6">
              ¿Deseas actualizar <strong className="text-[#092B2B]">«{nombre.trim()}»</strong>? Los cambios se guardarán en la base de datos.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[#092B2B]/20 text-[#092B2B]"
                onClick={() => setShowUpdateConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-[#092B2B] hover:bg-[#092B2B]/90 text-white"
                onClick={doUpdateProduct}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Actualizar
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
            <p className="text-[#092B2B]/70 text-sm mb-6">
              ¿Estás seguro de desactivar <strong className="text-[#092B2B]">{product.nombre}</strong>? Podrás reactivarlo después.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[#092B2B]/20 text-[#092B2B]"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={loading}
              >
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
            <button 
              onClick={copyCode}
              className="text-sm text-white/70 flex items-center gap-1 hover:text-white transition-colors mt-1"
            >
              <span className="font-mono font-semibold">{product.codigo}</span>
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
            className="text-white hover:bg-[#092B2B]/60"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - Con scroll */}
        <div className="flex-1 overflow-y-auto pb-20 sm:pb-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
            {/* Image */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#092B2B]">Imagen del producto</Label>
              <div 
                className="relative aspect-video bg-[#092B2B]/5 rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-[#092B2B]/30 hover:border-[#092B2B]/60 hover:bg-[#092B2B]/10 transition-all"
                onClick={() => !loading && fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Camera className="h-10 w-10 text-[#092B2B]/60" />
                    <span className="text-sm font-medium text-[#092B2B]/70">Toca para cambiar foto</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-3 bg-[#092B2B]/5 p-4 rounded-xl border border-[#092B2B]/10">
              <h3 className="font-semibold text-[#092B2B] text-sm">Información Básica</h3>
              
              <div>
                <Label htmlFor="nombre" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Nombre *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-2 border-[#092B2B]/20 focus:border-[#092B2B] focus:ring-[#092B2B]/20"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="descripcion" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Descripción</Label>
                <Input
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="mt-2 border-[#092B2B]/20 focus:border-[#092B2B] focus:ring-[#092B2B]/20"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="categoria" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Categoría *</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId} disabled={loading || loadingCategorias}>
                  <SelectTrigger className="mt-2 w-full border-[#092B2B]/20 focus:border-[#092B2B] focus:ring-[#092B2B]/20">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent className="relative z-9999">
                    {loadingCategorias ? (
                      <div className="p-2 text-sm text-[#092B2B]/70">Cargando...</div>
                    ) : categorias.length > 0 ? (
                      categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.nombre}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-[#092B2B]/70">No hay categorías</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-[#092B2B]/10">
                <Label htmlFor="activo" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">
                  Estado
                </Label>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <span className={`text-sm font-medium ${activo ? 'text-[#092B2B]' : 'text-red-600'}`}>
                    {activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <div className="p-1 rounded">
                    <Switch
                      id="activo"
                      checked={activo}
                      onCheckedChange={setActivo}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3 bg-[#BFA274]/10 p-4 rounded-xl border border-[#BFA274]/20">
              <h3 className="font-semibold text-[#092B2B] text-sm">Precios e Inventario</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="precio" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Precio Venta *</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#092B2B]/60 font-semibold">$</span>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      className="pl-8 border-[#BFA274]/20 focus:border-[#BFA274] focus:ring-[#BFA274]/20"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="costo" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Costo</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#092B2B]/60 font-semibold">$</span>
                    <Input
                      id="costo"
                      type="number"
                      step="0.01"
                      value={costo}
                      onChange={(e) => setCosto(e.target.value)}
                      className="pl-8 border-[#BFA274]/20 focus:border-[#BFA274] focus:ring-[#BFA274]/20"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="stock" className="text-xs font-semibold uppercase tracking-wide text-[#092B2B]">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="mt-2 border-[#BFA274]/20 focus:border-[#BFA274] focus:ring-[#BFA274]/20"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-3 bg-[#BFA274]/10 p-4 rounded-xl border border-[#BFA274]/20">
              <h3 className="font-semibold text-[#092B2B] text-sm flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#BFA274]" />
                Palabras Clave
              </h3>
              
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  placeholder="plata, brillante, vintage..."
                  className="border-[#BFA274]/20 focus:border-[#BFA274] focus:ring-[#BFA274]/20 flex-1"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addKeyword}
                  disabled={loading || !keywordInput.trim()}
                  className="bg-[#092B2B] hover:bg-[#092B2B]/90 border-[#092B2B] text-white shrink-0 h-9 w-9"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((keyword, idx) => (
                    <div
                      key={idx}
                      className="bg-[#BFA274]/30 text-[#092B2B] px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 group whitespace-nowrap"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(idx)}
                        className="opacity-60 hover:opacity-100 transition-opacity shrink-0"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-red-200/50 text-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Desactivar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-[#092B2B] hover:bg-[#092B2B]/90 text-white font-bold rounded-xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}