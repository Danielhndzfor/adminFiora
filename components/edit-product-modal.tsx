'use client'

import { useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import { PRODUCT_CATEGORIES } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Trash2, Copy, Camera, Package } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'

interface EditProductModalProps {
  product: Product
  onClose: () => void
}

export function EditProductModal({ product, onClose }: EditProductModalProps) {
  const { updateProduct, deleteProduct } = useStore()
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(product.price.toString())
  const [stock, setStock] = useState(product.stock.toString())
  const [category, setCategory] = useState(product.category || '')
  const [imagePreview, setImagePreview] = useState<string | null>(
    product.image !== '/products/default.jpg' ? product.image : null
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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

    updateProduct(product.id, {
      name: name.trim(),
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      category: category || undefined,
      image: imagePreview || '/products/default.jpg',
    })

    toast.success('Producto actualizado')
    onClose()
  }

  const handleDelete = () => {
    deleteProduct(product.id)
    toast.success('Producto eliminado')
    onClose()
  }

  const copyCode = () => {
    navigator.clipboard.writeText(product.code)
    toast.success('Codigo copiado')
  }

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 animate-in fade-in duration-150">
        <div className="w-full max-w-sm mx-4 bg-card rounded-2xl p-4 animate-in zoom-in-95 duration-200">
          <div className="text-center py-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Eliminar producto</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Estas seguro de eliminar {'"'}{product.name}{'"'}? Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 animate-in fade-in duration-150">
      <div className="w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto bg-card rounded-2xl p-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Editar producto</h2>
            <button 
              onClick={copyCode}
              className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <span className="font-mono">{product.code}</span>
              <Copy className="h-3 w-3" />
            </button>
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
              className="mt-1"
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
                  className="pl-7"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
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

          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
            <Button type="submit" className="flex-1">
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
