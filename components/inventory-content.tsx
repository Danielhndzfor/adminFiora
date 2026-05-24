'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus, Search, Package, Minus, Edit2, Loader2, Trash2, Eye,
  LayoutList, Grid2X2, SlidersHorizontal, ArrowDown, ArrowUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddProductModal } from './add-product-modal'
import { EditProductModal } from './edit-product-modal'
import { ImagePreviewModal } from './image-preview-modal'
import { fetchCategorias } from '@/lib/categories'
import { getPrincipalImagen } from '@/lib/image-handler-client'
import { toast } from 'sonner'
import Image from 'next/image'

function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(num)
}

function getStockColor(stock: number) {
  if (stock === 0) return 'text-red-600'
  if (stock <= 3) return 'text-yellow-600'
  return 'text-[#092B2B]'
}

function getStockBadgeStyle(stock: number) {
  if (stock === 0) return 'bg-red-100 text-red-700 border border-red-200'
  if (stock <= 3) return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
  return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
}

interface Category { id: number; nombre: string }

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
  imagenes?: string // JSON string del array de imágenes
  activo: boolean
  categoriaId: number
  categoria?: { id: number; nombre: string }
}

type ViewMode = 'list' | 'grid'
type StockFilter = 'all' | 'low' | 'none'

export function InventoryContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [categoriaFilter, setCategoriaFilter] = useState<number | null>(null)
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [updatingStock, setUpdatingStock] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<{ isOpen: boolean; url?: string; name?: string }>({ isOpen: false })
  const [swipeStart, setSwipeStart] = useState<{ x: number; productId: number | null }>({ x: 0, productId: null })
  const [swipeProduct, setSwipeProduct] = useState<number | null>(null)
  const [globalStats, setGlobalStats] = useState<{ activos: number; inactivos: number; totalStock: number }>({ activos: 0, inactivos: 0, totalStock: 0 })
  const [sortBy, setSortBy] = useState<'nombre' | 'precio' | 'stock'>('nombre')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'activos' | 'inactivos'>('activos')

  useEffect(() => {
    fetchCategorias().then(setCategories).catch(console.error)
  }, [])

  useEffect(() => {
    setProducts([])
    setPage(1)
    loadProducts(1, '', null, 'all', true)
    setIsInitialLoad(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProducts = async (
    targetPage = 1,
    palabra = '',
    catId: number | null = null,
    sf: StockFilter = 'all',
    isInitial = false,
  ) => {
    try {
      if (targetPage === 1 && isInitial) setLoading(true)
      else if (targetPage > 1) setLoadingMore(true)

      const params = new URLSearchParams()
      params.set('page', String(targetPage))
      params.set('limit', '25')
      if (palabra) params.set('palabra', palabra)
      if (catId) params.set('categoriaId', String(catId))
      if (sf === 'low') params.set('stockFiltro', 'bajo')
      else if (sf === 'none') params.set('stockFiltro', 'cero')

      const response = await fetch(`/api/products/public?${params.toString()}`)
      if (!response.ok) throw new Error('Error cargando productos')
      const data = await response.json()
      const incoming: Product[] = Array.isArray(data) ? data : data.productos || []
      const nextHasMore: boolean = Array.isArray(data) ? false : !!data.hasMore

      setProducts(prev => (targetPage === 1 ? incoming : [...prev, ...incoming]))
      setHasMore(nextHasMore)
      setPage(targetPage)
      
      // Cargar stats globales al cambiar filtros (solo en primera página)
      if (targetPage === 1) {
        loadGlobalStats(palabra, catId, sf)
      }
    } catch (error) {
      toast.error('Error cargando productos')
      console.error(error)
    } finally {
      if (targetPage === 1 && isInitial) setLoading(false)
      else if (targetPage > 1) setLoadingMore(false)
    }
  }

  const loadGlobalStats = async (palabra = '', catId: number | null = null, sf: StockFilter = 'all') => {
    try {
      const params = new URLSearchParams()
      if (palabra) params.set('palabra', palabra)
      if (catId) params.set('categoriaId', String(catId))
      if (sf === 'low') params.set('stockFiltro', 'bajo')
      else if (sf === 'none') params.set('stockFiltro', 'cero')

      const response = await fetch(`/api/products/stats?${params.toString()}`)
      if (!response.ok) throw new Error('Error cargando stats')
      const data = await response.json()
      setGlobalStats({
        activos: data.activos || 0,
        inactivos: data.inactivos || 0,
        totalStock: data.totalStock || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProducts(1, searchQuery.trim(), categoriaFilter, stockFilter)
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Reload on filter change
  useEffect(() => {
    loadProducts(1, searchQuery.trim(), categoriaFilter, stockFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaFilter, stockFilter])

  const handleQuickStockAdjust = async (product: Product, delta: number) => {
    const newStock = product.stock + delta
    if (newStock < 0) return
    setUpdatingStock(product.id)
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      })
      if (!res.ok) throw new Error()
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p))
      toast.success(`Stock: ${newStock}`)
    } catch {
      toast.error('Error actualizando stock')
    } finally {
      setUpdatingStock(null)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Desactivar "${product.nombre}"?`)) return
    try {
      const res = await fetch(`/api/products/${product.id}`, { 
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) throw new Error()
      setProducts(prev => prev.filter(p => p.id !== product.id))
      toast.success('Producto desactivado')
    } catch {
      toast.error('Error desactivando producto')
    } finally {
      setSwipeProduct(null)
    }
  }

  const handleTouchStart = (e: React.TouchEvent, productId: number) => {
    setSwipeStart({ x: e.touches[0].clientX, productId })
  }

  const handleTouchEnd = (e: React.TouchEvent, productId: number) => {
    const diff = swipeStart.x - e.changedTouches[0].clientX
    if (diff > 50) setSwipeProduct(productId)
    else if (diff < -50) setSwipeProduct(null)
  }

  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadProducts(page + 1, searchQuery.trim(), categoriaFilter, stockFilter)
      }
    }, { root: null, rootMargin: '300px', threshold: 0.1 })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, hasMore, loadingMore, page])

  const reloadCurrent = () => loadProducts(1, searchQuery.trim(), categoriaFilter, stockFilter)
  const activeFiltersCount = (categoriaFilter ? 1 : 0) + (stockFilter !== 'all' ? 1 : 0) + (statusFilter !== 'activos' ? 1 : 0)

  const getSortedProducts = () => {
    let filtered = [...products]
    
    // Filtrar por estado
    if (statusFilter === 'activos') {
      filtered = filtered.filter(p => p.activo)
    } else if (statusFilter === 'inactivos') {
      filtered = filtered.filter(p => !p.activo)
    }
    
    // Ordenar
    if (sortBy === 'nombre') {
      filtered.sort((a, b) => sortDir === 'asc' 
        ? a.nombre.localeCompare(b.nombre)
        : b.nombre.localeCompare(a.nombre)
      )
    } else if (sortBy === 'precio') {
      filtered.sort((a, b) => {
        const diff = parseFloat(String(a.precio)) - parseFloat(String(b.precio))
        return sortDir === 'asc' ? diff : -diff
      })
    } else if (sortBy === 'stock') {
      filtered.sort((a, b) => {
        const diff = a.stock - b.stock
        return sortDir === 'asc' ? diff : -diff
      })
    }
    return filtered
  }

  const sortedProducts = getSortedProducts()

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#092B2B]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── BARRA DE ACCIONES ─────────────────────────── */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#092B2B]/40" />
          <Input
            type="search"
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm border-[#092B2B]/20 focus-visible:ring-[#092B2B]/20 bg-white"
          />
        </div>

        {/* Filtros */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn(
            'relative h-9 w-9 rounded-lg border flex items-center justify-center transition-colors shrink-0',
            showFilters
              ? 'bg-[#092B2B] border-[#092B2B] text-white'
              : 'border-[#092B2B]/20 text-[#092B2B]/60 hover:border-[#092B2B]/40 hover:text-[#092B2B] bg-white'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#BFA274] text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Toggle de vista */}
        <div className="flex rounded-lg border border-[#092B2B]/20 overflow-hidden shrink-0 bg-white">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'h-9 w-9 flex items-center justify-center transition-colors',
              viewMode === 'list' ? 'bg-[#092B2B] text-white' : 'text-[#092B2B]/40 hover:bg-[#092B2B]/5 hover:text-[#092B2B]'
            )}
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'h-9 w-9 flex items-center justify-center transition-colors border-l border-[#092B2B]/20',
              viewMode === 'grid' ? 'bg-[#092B2B] text-white' : 'text-[#092B2B]/40 hover:bg-[#092B2B]/5 hover:text-[#092B2B]'
            )}
          >
            <Grid2X2 className="h-4 w-4" />
          </button>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          size="sm"
          className="h-9 bg-[#092B2B] hover:bg-[#092B2B]/85 text-white shrink-0 px-3"
        >
          <Plus className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline text-sm">Nuevo</span>
        </Button>
      </div>

      {/* ── PANEL DE FILTROS ──────────────────────────── */}
      {showFilters && (
        <div className="rounded-xl border border-[#092B2B]/10 bg-[#092B2B]/0.03 p-3 flex flex-col gap-2.5">
          {/* Categoría */}
          <div>
            <p className="text-[10px] font-semibold text-[#092B2B]/50 uppercase tracking-wider mb-1.5">Categoría</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategoriaFilter(null)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border font-medium transition-colors',
                  !categoriaFilter
                    ? 'bg-[#092B2B] text-white border-[#092B2B]'
                    : 'bg-white border-[#092B2B]/20 text-[#092B2B]/60 hover:border-[#092B2B]/40 hover:text-[#092B2B]'
                )}
              >
                Todas
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaFilter(prev => prev === cat.id ? null : cat.id)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border font-medium transition-colors',
                    categoriaFilter === cat.id
                      ? 'bg-[#092B2B] text-white border-[#092B2B]'
                      : 'bg-white border-[#092B2B]/20 text-[#092B2B]/60 hover:border-[#092B2B]/40 hover:text-[#092B2B]'
                  )}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Stock */}
          <div className="border-t border-[#092B2B]/10 pt-2.5">
            <p className="text-[10px] font-semibold text-[#092B2B]/50 uppercase tracking-wider mb-1.5">Stock</p>
            <div className="flex gap-1.5">
              {([
                { value: 'all', label: 'Todos' },
                { value: 'low', label: 'Stock bajo' },
                { value: 'none', label: 'Sin stock' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStockFilter(opt.value)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border font-medium transition-colors',
                    stockFilter === opt.value
                      ? 'bg-[#092B2B] text-white border-[#092B2B]'
                      : 'bg-white border-[#092B2B]/20 text-[#092B2B]/60 hover:border-[#092B2B]/40 hover:text-[#092B2B]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado */}
          <div className="border-t border-[#092B2B]/10 pt-2.5">
            <p className="text-[10px] font-semibold text-[#092B2B]/50 uppercase tracking-wider mb-1.5">Estado</p>
            <div className="flex gap-1.5">
              {([
                { value: 'all', label: 'Todos' },
                { value: 'activos', label: 'Activos' },
                { value: 'inactivos', label: 'Inactivos' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border font-medium transition-colors',
                    statusFilter === opt.value
                      ? 'bg-[#092B2B] text-white border-[#092B2B]'
                      : 'bg-white border-[#092B2B]/20 text-[#092B2B]/60 hover:border-[#092B2B]/40 hover:text-[#092B2B]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STATS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white border border-[#092B2B]/15 py-3 px-4 shadow-sm text-center hover:border-[#092B2B]/30 transition-colors">
          <p className="text-2xl font-bold leading-none tracking-tight text-emerald-600">{globalStats.activos}</p>
          <p className="text-xs text-[#092B2B]/50 mt-2 font-semibold">Activos</p>
        </div>
        <div className="rounded-xl bg-white border border-[#092B2B]/15 py-3 px-4 shadow-sm text-center hover:border-[#092B2B]/30 transition-colors">
          <p className="text-2xl font-bold leading-none tracking-tight text-gray-500">{globalStats.inactivos}</p>
          <p className="text-xs text-[#092B2B]/50 mt-2 font-semibold">Inactivos</p>
        </div>
        <div className="rounded-xl bg-white border border-[#092B2B]/15 py-3 px-4 shadow-sm text-center hover:border-[#092B2B]/30 transition-colors col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold leading-none tracking-tight text-[#092B2B]">{globalStats.totalStock}</p>
          <p className="text-xs text-[#092B2B]/50 mt-2 font-semibold">Total stock</p>
        </div>
      </div>

      {/* ── ORDENAMIENTO ──────────────────────────────── */}
      <div className="flex items-center justify-between bg-white border border-[#092B2B]/15 rounded-xl p-3 shadow-sm">
        <p className="text-xs font-semibold text-[#092B2B]/50 uppercase tracking-wider">Ordenar por:</p>
        <div className="flex gap-2 items-center">
          {/* Botones de campo */}
          <div className="flex gap-1.5 rounded-lg border border-[#092B2B]/20 p-1 bg-[#092B2B]/2">
            {[
              { value: 'nombre', label: 'Nombre' },
              { value: 'precio', label: 'Precio' },
              { value: 'stock', label: 'Stock' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value as 'nombre' | 'precio' | 'stock')}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-md font-medium transition-colors',
                  sortBy === opt.value
                    ? 'bg-[#092B2B] text-white'
                    : 'bg-transparent text-[#092B2B]/60 hover:text-[#092B2B]'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Botón dirección */}
          <button
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
            className="h-8 w-8 rounded-lg border border-[#092B2B]/20 bg-white hover:bg-[#092B2B]/5 flex items-center justify-center text-[#092B2B] transition-colors shrink-0"
            title={sortDir === 'asc' ? 'Ascendente' : 'Descendente'}
          >
            {sortDir === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* ── EMPTY STATE ───────────────────────────────── */}
      {products.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-[#092B2B]/30">
          <Package className="h-14 w-14 opacity-20" />
          <p className="text-sm font-semibold">Sin resultados</p>
          <p className="text-xs">Intenta con otra búsqueda o filtro</p>
        </div>
      )}

      {/* ── VISTA LISTA ───────────────────────────────── */}
      {viewMode === 'list' && products.length > 0 && (
        <div className="flex flex-col gap-2">
          {sortedProducts.map((product, index) => (
            <div
              key={product.id}
              className="relative overflow-hidden rounded-xl"
              onTouchStart={(e) => handleTouchStart(e, product.id)}
              onTouchEnd={(e) => handleTouchEnd(e, product.id)}
            >
              {/* Swipe backdrop */}
              {swipeProduct === product.id && (
                <div className="absolute inset-y-0 right-0 w-16 bg-red-500 flex flex-col items-center justify-center gap-0.5 animate-in slide-in-from-right duration-150">
                  <button onClick={() => handleDelete(product)} className="flex flex-col items-center gap-0.5 text-white w-full h-full justify-center">
                    <Trash2 className="h-4 w-4" />
                    <span className="text-[9px] font-semibold">Borrar</span>
                  </button>
                </div>
              )}

              {/* Card row */}
              <div className={cn(
                'flex items-center gap-3 p-2.5 bg-white border border-[#092B2B]/25 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:border-[#092B2B]/40',
                swipeProduct === product.id && '-translate-x-16'
              )}>
                {/* Imagen - Botón Ver Imagen */}
                <div
                  className="relative h-14 w-14 rounded-xl bg-[#092B2B]/5 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer group"
                  onClick={() => {
                    const imagenPrincipal = product.imagenes 
                      ? getPrincipalImagen(product.imagenes)?.url 
                      : product.imagen
                    setPreviewImage({ isOpen: true, url: imagenPrincipal, name: product.nombre })
                  }}
                >
                  {product.imagenes || product.imagen ? (
                    <>
                      <Image
                        src={product.imagenes ? getPrincipalImagen(product.imagenes)?.url || '/placeholder.jpg' : product.imagen || '/placeholder.jpg'}
                        alt={product.nombre}
                        fill
                        className="object-cover"
                        sizes="56px"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                      <Eye className="h-6 w-6 text-[#092B2B]/40 group-hover:text-[#092B2B]/60 absolute opacity-0 group-hover:opacity-100" />
                    </>
                  ) : (
                    <Package className="h-6 w-6 text-[#092B2B]/20" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-[10px] font-bold text-white">VER</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Fila 1: nombre + editar */}
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs font-semibold text-[#092B2B] line-clamp-1 flex-1 leading-tight">{product.nombre}</p>
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-[#092B2B] hover:bg-[#092B2B]/10 transition-colors shrink-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Fila 2: código + categoría */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] font-mono text-[#092B2B]/40 bg-[#092B2B]/5 px-1.5 py-0.5 rounded-md">{product.codigo}</span>
                    {product.categoria && (
                      <span className="text-[9px] font-medium text-[#BFA274]/80 bg-[#BFA274]/10 px-1.5 py-0.5 rounded-md">{product.categoria.nombre}</span>
                    )}
                  </div>

                  {/* Fila 3: precio + stock */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#BFA274]">{formatCurrency(product.precio)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickStockAdjust(product, -1)}
                        disabled={product.stock <= 0 || updatingStock === product.id}
                        className="h-5 w-5 rounded-md border border-[#092B2B]/15 flex items-center justify-center hover:bg-[#092B2B]/8 disabled:opacity-30 transition-colors text-[#092B2B]"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className={cn('text-xs font-bold min-w-[1.4rem] text-center tabular-nums', getStockColor(product.stock))}>
                        {updatingStock === product.id
                          ? <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin align-middle" />
                          : product.stock}
                      </span>
                      <button
                        onClick={() => handleQuickStockAdjust(product, 1)}
                        disabled={updatingStock === product.id}
                        className="h-5 w-5 rounded-md border border-[#092B2B]/15 flex items-center justify-center hover:bg-[#092B2B]/8 disabled:opacity-30 transition-colors text-[#092B2B]"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── VISTA CUADRÍCULA ──────────────────────────── */}
      {viewMode === 'grid' && products.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {sortedProducts.map((product, index) => (
            <div
              key={product.id}
              className="bg-white border border-[#092B2B]/25 rounded-2xl shadow-md overflow-hidden hover:shadow-lg hover:border-[#092B2B]/40 transition-all duration-200 flex flex-col"
            >
              {/* Imagen - Botón Ver Imagen */}
              <div
                className="relative w-full aspect-square bg-[#092B2B]/5 flex items-center justify-center overflow-hidden cursor-pointer group shrink-0"
                onClick={() => {
                  const imagenPrincipal = product.imagenes 
                    ? getPrincipalImagen(product.imagenes)?.url 
                    : product.imagen
                  setPreviewImage({ isOpen: true, url: imagenPrincipal, name: product.nombre })
                }}
              >
                {product.imagenes || product.imagen ? (
                  <>
                    <Image
                      src={product.imagenes ? getPrincipalImagen(product.imagenes)?.url || '/products/default.jpg' : product.imagen || '/products/default.jpg'}
                      alt={product.nombre}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                    <Eye className="h-12 w-12 text-[#092B2B]/40 group-hover:text-[#092B2B]/60 absolute opacity-0 group-hover:opacity-100" />
                  </>
                ) : (
                  <Package className="h-20 w-20 text-[#092B2B]/15" />
                )}
                {/* Badge de stock */}
                <div className={cn(
                  'absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                  getStockBadgeStyle(product.stock)
                )}>
                  {product.stock}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-xs font-bold text-white">VER IMAGEN</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5 flex flex-col flex-1">
                <p className="text-[9px] font-mono text-[#092B2B]/35 mb-0.5 tracking-wide">{product.codigo}</p>
                <p className="text-[11px] font-semibold text-[#092B2B] line-clamp-2 leading-tight mb-1 flex-1">{product.nombre}</p>
                {product.categoria && (
                  <p className="text-[9px] font-medium text-[#BFA274]/80 bg-[#BFA274]/10 px-1.5 py-0.5 rounded-md w-fit mb-1.5">{product.categoria.nombre}</p>
                )}
                <p className="text-sm font-bold text-[#BFA274] mb-2">{formatCurrency(product.precio)}</p>

                {/* Controles */}
                <div className="flex items-center gap-1 mt-auto">
                  <button
                    onClick={() => handleQuickStockAdjust(product, -1)}
                    disabled={product.stock <= 0 || updatingStock === product.id}
                    className="h-6 w-6 rounded-lg border border-[#092B2B]/15 flex items-center justify-center hover:bg-[#092B2B]/8 disabled:opacity-30 transition-colors text-[#092B2B]"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className={cn(
                    'text-xs font-bold flex-1 text-center tabular-nums',
                    getStockColor(product.stock)
                  )}>
                    {updatingStock === product.id
                      ? <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      : product.stock}
                  </span>
                  <button
                    onClick={() => handleQuickStockAdjust(product, 1)}
                    disabled={updatingStock === product.id}
                    className="h-6 w-6 rounded-lg border border-[#092B2B]/15 flex items-center justify-center hover:bg-[#092B2B]/8 disabled:opacity-30 transition-colors text-[#092B2B]"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="h-6 w-6 rounded-lg border border-[#092B2B]/20 flex items-center justify-center text-[#092B2B] hover:bg-[#092B2B]/10 transition-colors ml-1"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sentinel infinite scroll */}
      <div ref={sentinelRef} className="h-6 flex items-center justify-center">
        {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-[#092B2B]" />}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} onSuccess={reloadCurrent} />
      )}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={() => setEditingProduct(null)}
          onSuccess={reloadCurrent}
        />
      )}
      <ImagePreviewModal
        isOpen={previewImage.isOpen}
        onClose={() => setPreviewImage({ isOpen: false })}
        imageUrl={previewImage.url}
        productName={previewImage.name}
      />
    </div>
  )
}

