'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { ProductCard } from './product-card'
import { CartPanel } from './cart-panel'
import { ImagePreviewModal } from './image-preview-modal'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'
import { Search, ShoppingCart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function SalesContent() {
  const { products, cart, addToCart, getCartTotal } = useStore()
  const [showCart, setShowCart] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)

  // Filter by name, category, OR code
  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query)
    )
  })

  const handleProductTap = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Sin stock disponible')
      return
    }

    addToCart(product)
    toast.success('Agregado al carrito', {
      description: product.name,
      duration: 1500,
    })
  }

  const handlePreviewImage = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewProduct(product)
  }

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Cart button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o codigo (FIO-XXXX)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant={cartItemCount > 0 ? 'default' : 'outline'}
          size="icon"
          className="relative shrink-0"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartItemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
            >
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Cart summary banner */}
      {cartItemCount > 0 && (
        <Button 
          variant="outline"
          className="w-full border-primary/30 bg-primary/5"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Ver carrito ({cartItemCount} items) - ${getCartTotal().toLocaleString()}
        </Button>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onTap={() => handleProductTap(product)}
            onPreview={(e) => handlePreviewImage(product, e)}
            showCode
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron productos</p>
        </div>
      )}

      {/* Cart panel */}
      {showCart && (
        <CartPanel onClose={() => setShowCart(false)} />
      )}

      {/* Image preview */}
      {previewProduct && (
        <ImagePreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}
    </div>
  )
}
