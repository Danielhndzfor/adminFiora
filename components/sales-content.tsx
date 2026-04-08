'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Package, Eye, Loader2, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CartPanel } from './cart-panel'
import { ImagePreviewModal } from './image-preview-modal'
import { toast } from 'sonner'

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

interface Product {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  precio: number | string
  stock: number
  imagen?: string
  activo: boolean
  categoriaId: number
  categoria?: { id: number; nombre: string }
}

interface CartItem {
  product: Product
  quantity: number
  customPrice?: number
}

export function SalesContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ isOpen: boolean; url?: string; name?: string }>({ isOpen: false })

  // Cargar productos iniciales
  useEffect(() => {
    loadProducts(searchQuery.trim(), true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProducts = async (palabra = '', isInitial = false) => {
    try {
      if (isInitial) setLoading(true)

      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '100')
      if (palabra) params.set('palabra', palabra)

      const response = await fetch(`/api/products?${params.toString()}`)
      if (!response.ok) throw new Error('Error cargando productos')
      const data = await response.json()
      const incoming: Product[] = Array.isArray(data) ? data : data.productos || []

      setProducts(incoming.filter(p => p.activo && p.stock > 0))
    } catch (error) {
      toast.error('Error cargando productos')
      console.error(error)
    } finally {
      if (isInitial) {
        setLoading(false)
        setIsInitialLoad(false)
      }
    }
  }

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProducts(searchQuery.trim())
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Sin stock disponible')
      return
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })

    toast.success('Agregado al carrito', { description: product.nombre, duration: 1200 })
  }

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + (item.customPrice || parseFloat(item.product.precio as string)) * item.quantity, 0)

  if (loading && isInitialLoad) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#092B2B]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── BÚSQUEDA ────────────────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#092B2B]/40" />
          <Input
            type="search"
            placeholder="Buscar código o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm border-[#092B2B]/20 focus-visible:ring-[#092B2B]/20 bg-white"
          />
        </div>

        {/* Carrito button */}
        <button
          onClick={() => setShowCart(true)}
          className={cn(
            'relative h-10 px-3 rounded-lg border flex items-center gap-2 transition-all shrink-0 font-semibold text-sm',
            cartItemCount > 0
              ? 'bg-[#092B2B] border-[#092B2B] text-white hover:bg-[#092B2B]/85'
              : 'border-[#092B2B]/20 text-[#092B2B]/60 hover:border-[#092B2B]/40 hover:text-[#092B2B] bg-white'
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>{cartItemCount}</span>
          {cartItemCount > 0 && (
            <span className="text-xs font-bold ml-1">{formatCurrency(cartTotal)}</span>
          )}
        </button>
      </div>

      {/* ── EMPTY STATE ───────────────────────────── */}
      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-[#092B2B]/30">
          <Package className="h-14 w-14 opacity-20" />
          <p className="text-sm font-semibold">Sin productos</p>
          <p className="text-xs">Intenta otra búsqueda</p>
        </div>
      )}

      {/* ── GRID DE PRODUCTOS ──────────────────────── */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => handleAddToCart(product)}
              className="bg-white border border-[#092B2B]/25 rounded-xl shadow-sm overflow-hidden hover:shadow-lg hover:border-[#092B2B]/40 transition-all duration-200 flex flex-col cursor-pointer active:scale-95"
            >
              {/* Imagen */}
              <div
                className="relative w-full aspect-square bg-[#092B2B]/5 flex items-center justify-center overflow-hidden group shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setPreviewImage({ isOpen: true, url: product.imagen, name: product.nombre })
                }}
              >
                {product.imagen
                  ? <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover" />
                  : <Package className="h-16 w-16 text-[#092B2B]/15" />
                }
                {/* Badge de stock */}
                <div className={cn(
                  'absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full leading-none',
                  getStockBadgeStyle(product.stock)
                )}>
                  {product.stock}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="h-5 w-5 text-white drop-shadow" />
                </div>
              </div>

              {/* Info */}
              <div className="p-2 flex flex-col flex-1">
                <p className="text-[9px] font-mono text-[#092B2B]/40 mb-0.5">{product.codigo}</p>
                <p className="text-xs font-semibold text-[#092B2B] line-clamp-2 leading-tight mb-auto">{product.nombre}</p>
                {product.categoria && (
                  <p className="text-[8px] font-medium text-[#BFA274]/80 bg-[#BFA274]/10 px-1.5 py-0.5 rounded-md w-fit mb-1.5 mt-1">{product.categoria.nombre}</p>
                )}
                <p className="text-sm font-bold text-[#BFA274]">{formatCurrency(product.precio)}</p>
              </div>

              {/* Button agregar */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddToCart(product)
                }}
                className="mx-2 mb-2 h-8 rounded-lg bg-[#092B2B] text-white hover:bg-[#092B2B]/85 transition-colors flex items-center justify-center gap-1 text-xs font-semibold active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── CART PANEL ────────────────────────────── */}
      {showCart && (
        <CartPanel
          cart={cart}
          setCart={setCart}
          onClose={() => setShowCart(false)}
          onCheckoutSuccess={() => {
            setCart([])
            setShowCart(false)
            setSearchQuery('')
            loadProducts('', false)
          }}
        />
      )}

      {/* ── IMAGE PREVIEW ─────────────────────────── */}
      <ImagePreviewModal
        isOpen={previewImage.isOpen}
        onClose={() => setPreviewImage({ isOpen: false })}
        imageUrl={previewImage.url}
        productName={previewImage.name}
      />
    </div>
  )
}
