'use client'

import { useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import { PRODUCT_CATEGORIES } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, RefreshCw, Camera, Package } from 'lucide-react'
import { toast } from 'sonner'

interface AddProductModalProps {
  onClose: () => void
}

export function AddProductModal({ onClose }: AddProductModalProps) {
  const { addProduct } = useStore()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [category, setCategory] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Ingresa el nombre del producto')
      return
    }
    
    if (!price || parseFloat(price) <= 0) {
      toast.error('Ingresa un precio valido')
      return
    }

    addProduct({
      name: name.trim(),
      price: parseFloat(price),
      stock: parseInt(stock) || 1,
      category: category || undefined,
      image: imagePreview || '/products/default.jpg',
    })

    toast.success('Producto agregado con codigo generado')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 animate-in fade-in duration-150">
      <div className="w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto bg-card rounded-2xl p-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Nuevo producto</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Codigo generado automaticamente
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Image picker */}
          <div>
            <Label>Imagen del producto</Label>
            <div 
              className="mt-2 relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Toca para agregar foto</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Anillo de plata"
              className="mt-1"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Precio</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="pl-7"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="stock">Stock inicial</Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="1"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona categoria" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full h-12 mt-4">
            Agregar producto
          </Button>
        </form>
      </div>
    </div>
  )
}
