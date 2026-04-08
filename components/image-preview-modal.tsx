'use client'

import { X, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl?: string
  productName?: string
}

export function ImagePreviewModal({ isOpen, onClose, imageUrl, productName }: ImagePreviewModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-999 flex items-center justify-center bg-black/80 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl mx-4 bg-[#feffff] rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-[#092B2B]/20 hover:bg-[#092B2B]/40 text-[#092B2B]"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Content */}
        <div className="flex flex-col items-center gap-4 p-6">
          {productName && (
            <h2 className="text-2xl font-bold text-[#092B2B]">{productName}</h2>
          )}
          
          {/* Large image */}
          <div className="w-full max-h-[70vh] bg-[#092B2B]/5 rounded-xl overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={productName}
                className="w-full h-full object-contain"
              />
            ) : (
              <Package className="h-24 w-24 text-[#092B2B]/30" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
