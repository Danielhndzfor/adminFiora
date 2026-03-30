'use client'

import type { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { X, Package } from 'lucide-react'

interface ImagePreviewModalProps {
  product: Product
  onClose: () => void
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function ImagePreviewModal({ product, onClose }: ImagePreviewModalProps) {
  return (
    <div 
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm mx-4 bg-card rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Large image */}
        <div className="aspect-square bg-muted">
          {product.image && product.image !== '/products/default.jpg' ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/5 to-primary/10">
              <Package className="h-24 w-24 text-primary/30" />
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="p-4">
          <p className="text-xs font-mono text-muted-foreground mb-1">{product.code}</p>
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xl font-bold text-primary">{formatCurrency(product.price)}</p>
            <p className="text-sm text-muted-foreground">
              Stock: <span className="font-medium text-foreground">{product.stock}</span>
            </p>
          </div>
          {product.category && (
            <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
          )}
        </div>
      </div>
    </div>
  )
}
