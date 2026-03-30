'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import type { PaymentMethod } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { X, Minus, Plus, Trash2, Banknote, CreditCard, Wallet, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CartPanelProps {
  onClose: () => void
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function CartPanel({ onClose }: CartPanelProps) {
  const { cart, removeFromCart, updateCartItemQuantity, clearCart, checkoutCart, getCartTotal } = useStore()
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)

  const handleCheckout = () => {
    if (!selectedPayment) {
      toast.error('Selecciona un metodo de pago')
      return
    }
    
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    checkoutCart(selectedPayment)
    toast.success(`Venta completada: ${itemCount} productos`, {
      description: formatCurrency(getCartTotal()),
      duration: 3000,
    })
    onClose()
  }

  const paymentMethods: { method: PaymentMethod; icon: typeof Banknote; label: string; colorClass: string }[] = [
    { method: 'cash', icon: Banknote, label: 'Efectivo', colorClass: 'bg-success/10 border-success/30 data-[selected=true]:bg-success data-[selected=true]:text-white' },
    { method: 'transfer', icon: CreditCard, label: 'Transferencia', colorClass: 'bg-chart-2/10 border-chart-2/30 data-[selected=true]:bg-chart-2 data-[selected=true]:text-white' },
    { method: 'other', icon: Wallet, label: 'Otro', colorClass: 'bg-muted data-[selected=true]:bg-foreground data-[selected=true]:text-background' },
  ]

  if (cart.length === 0) {
    return (
      <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 animate-in fade-in duration-150">
        <div className="w-full max-w-lg bg-card rounded-t-2xl p-4 pb-safe animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Carrito</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">El carrito esta vacio</p>
            <p className="text-sm text-muted-foreground mt-1">Toca productos para agregarlos</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-card rounded-t-2xl p-4 pb-safe animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Carrito</h2>
            <p className="text-sm text-muted-foreground">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} productos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-1" />
              Vaciar
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">{item.product.code}</p>
                <p className="text-sm text-primary font-semibold">
                  {formatCurrency(item.customPrice ?? item.product.price)}
                </p>
              </div>
              
              {/* Quantity controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                onClick={() => removeFromCart(item.product.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-border pt-4 mb-4 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(getCartTotal())}</span>
          </div>
        </div>

        {/* Payment selection */}
        <div className="mb-4 shrink-0">
          <p className="text-sm text-muted-foreground mb-2">Metodo de pago</p>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map(({ method, icon: Icon, label, colorClass }) => (
              <Button
                key={method}
                variant="outline"
                data-selected={selectedPayment === method}
                className={cn(
                  'flex flex-col items-center gap-1 h-16 transition-all active:scale-95',
                  colorClass
                )}
                onClick={() => setSelectedPayment(method)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Checkout button */}
        <Button
          className="w-full h-14 text-lg font-semibold shrink-0"
          disabled={!selectedPayment}
          onClick={handleCheckout}
        >
          Completar venta
        </Button>
      </div>
    </div>
  )
}
