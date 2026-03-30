'use client'

import type { Product } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Package, Maximize2 } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onTap: () => void
  onPreview?: (e: React.MouseEvent) => void
  showCode?: boolean
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function getStockIndicator(stock: number) {
  if (stock <= 0) return { color: 'bg-muted', text: 'Sin stock' }
  if (stock <= 1) return { color: 'bg-stock-low', text: `${stock}` }
  if (stock <= 3) return { color: 'bg-stock-medium', text: `${stock}` }
  return { color: 'bg-stock-high', text: `${stock}` }
}

export function ProductCard({ product, onTap, onPreview, showCode }: ProductCardProps) {
  const stockInfo = getStockIndicator(product.stock)
  const isOutOfStock = product.stock <= 0

  return (
    <Card 
      className={cn(
        'overflow-hidden cursor-pointer transition-all duration-150 active:scale-[0.98]',
        isOutOfStock && 'opacity-50'
      )}
      onClick={onTap}
    >
      <div className="relative aspect-square bg-muted">
        {/* Product image placeholder */}
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary/5 to-primary/10">
          <Package className="h-12 w-12 text-primary/30" />
        </div>
        
        {/* Preview button */}
        {onPreview && (
          <button
            onClick={onPreview}
            className="absolute top-2 left-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
          >
            <Maximize2 className="h-4 w-4 text-white" />
          </button>
        )}
        
        {/* Stock indicator */}
        <div className={cn(
          'absolute top-2 right-2 h-6 min-w-6 px-1.5 rounded-full flex items-center justify-center',
          stockInfo.color
        )}>
          <span className="text-[10px] font-bold text-white">
            {stockInfo.text}
          </span>
        </div>
        
        {/* Product code */}
        {showCode && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
            <span className="text-[10px] font-mono text-white">{product.code}</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <h3 className="text-sm font-medium leading-tight line-clamp-2 min-h-2.5rem">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-primary mt-1">
          {formatCurrency(product.price)}
        </p>
      </CardContent>
    </Card>
  )
}
