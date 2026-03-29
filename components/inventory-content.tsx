'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Package, Minus, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddProductModal } from './add-product-modal'
import { EditProductModal } from './edit-product-modal'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function getStockColor(stock: number) {
  if (stock <= 1) return 'text-stock-low'
  if (stock <= 3) return 'text-stock-medium'
  return 'text-stock-high'
}

export function InventoryContent() {
  const { products, updateStock, deleteProduct } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query)
    )
  })

  const handleQuickStockAdjust = (product: Product, delta: number) => {
    const newStock = product.stock + delta
    if (newStock < 0) return
    updateStock(product.id, newStock)
    toast.success(`Stock actualizado: ${newStock}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o codigo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAddModal(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs text-muted-foreground">Productos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
            <p className="text-xs text-muted-foreground">Total stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-stock-low">{products.filter(p => p.stock <= 3).length}</p>
            <p className="text-xs text-muted-foreground">Stock bajo</p>
          </CardContent>
        </Card>
      </div>

      {/* Product list */}
      <div className="flex flex-col gap-2">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-3">
                {/* Product image placeholder */}
                <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Package className="h-6 w-6 text-primary/30" />
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {product.code}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
                </div>

                {/* Stock controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuickStockAdjust(product, -1)}
                    disabled={product.stock <= 0}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className={cn(
                    'w-8 text-center font-bold text-sm',
                    getStockColor(product.stock)
                  )}>
                    {product.stock}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuickStockAdjust(product, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Edit button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingProduct(product)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No se encontraron productos</p>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  )
}
