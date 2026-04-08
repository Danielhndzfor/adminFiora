'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Minus, Plus, Trash2, Copy, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(num)
}

interface Product {
  id: number
  codigo: string
  nombre: string
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

interface PaymentMethod {
  id: number
  nombre: string
  descripcion?: string
  activo: boolean
}

interface CartPanelProps {
  cart: CartItem[]
  setCart: (cart: CartItem[]) => void
  onClose: () => void
  onCheckoutSuccess: () => void
}

export function CartPanel({ cart, setCart, onClose, onCheckoutSuccess }: CartPanelProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Cargar métodos de pago
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const res = await fetch('/api/payment-methods')
        if (res.ok) {
          const methods = await res.json()
          setPaymentMethods(methods)
        }
      } catch (err) {
        console.error('Error cargando métodos de pago:', err)
      }
    }
    loadPaymentMethods()
  }, [])

  const cartTotal = cart.reduce((sum, item) => sum + (item.customPrice || parseFloat(item.product.precio as string)) * item.quantity, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleRemoveItem = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId))
    toast.success('Producto removido del carrito')
  }

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.product.stock))
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const handleCheckout = async () => {
    if (!selectedPaymentId) {
      toast.error('Selecciona un método de pago')
      return
    }

    // Obtener usuarioId de localStorage
    const userStr = localStorage.getItem('usuario')
    if (!userStr) {
      toast.error('Debes iniciar sesión')
      onClose()
      return
    }

    try {
      const user = JSON.parse(userStr)
      const usuarioId = user.id

      setIsProcessing(true)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId,
          metodoPagoId: selectedPaymentId,
          items: cart.map(item => ({
            productId: item.product.id,
            cantidad: item.quantity,
            precio: item.customPrice || parseFloat(item.product.precio as string),
          })),
          notas: notes || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear la orden')
      }

      const order = await response.json()
      toast.success('¡Venta registrada!', {
        description: `Ticket: ${order.numeroTicket} - Total: ${formatCurrency(order.montoTotal)}`,
        duration: 3000,
      })

      onCheckoutSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error procesando la compra')
      console.error(error)
    } finally {
      setIsProcessing(false)
      setShowConfirm(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-150">
        <div className="w-full max-w-lg bg-white rounded-2xl p-6 mx-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#092B2B]">Carrito</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🛒</div>
            <p className="text-[#092B2B]/60 font-semibold">Carrito vacío</p>
            <p className="text-sm text-[#092B2B]/40 mt-1">Agrega productos para continuar</p>
          </div>
          <Button onClick={onClose} className="w-full mt-4 bg-[#092B2B] hover:bg-[#092B2B]/85">
            Continuar comprando
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl mx-4 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#092B2B]/10 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[#092B2B]">Carrito</h2>
            <p className="text-xs text-[#092B2B]/60 font-medium">{cartItemCount} artículos</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-[#092B2B]">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!showConfirm ? (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 bg-[#092B2B]/5 rounded-lg border border-[#092B2B]/10">
                  {/* Producto info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#092B2B] text-sm truncate">{item.product.nombre}</p>
                    <p className="text-xs text-[#092B2B]/50 font-mono">{item.product.codigo}</p>
                    <p className="text-sm font-bold text-[#BFA274] mt-0.5">
                      {formatCurrency(item.customPrice || parseFloat(item.product.precio as string))}
                    </p>
                  </div>

                  {/* Controles cantidad */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, -1)}
                      className="h-6 w-6 rounded-md border border-[#092B2B]/20 flex items-center justify-center hover:bg-[#092B2B]/10 transition-colors text-[#092B2B]"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center font-semibold text-[#092B2B] text-sm">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="h-6 w-6 rounded-md border border-[#092B2B]/20 flex items-center justify-center hover:bg-[#092B2B]/10 disabled:opacity-30 transition-colors text-[#092B2B]"
                    >
                      <Plus className="h-3 w-3" />
                    </button>

                    {/* Borrar */}
                    <button
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="h-6 w-6 ml-1 rounded-md border border-red-200 flex items-center justify-center hover:bg-red-50 transition-colors text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones */}
            <div className="border-t border-[#092B2B]/10 p-4 space-y-3 shrink-0">
              {/* Total */}
              <div className="flex items-center justify-between p-3 bg-[#B FA274]/10 rounded-xl border border-[#BFA274]/20">
                <p className="font-semibold text-[#092B2B]">Total:</p>
                <p className="text-xl font-bold text-[#BFA274]">{formatCurrency(cartTotal)}</p>
              </div>

              {/* Métodos de pago */}
              <div>
                <p className="text-xs font-semibold text-[#092B2B]/50 uppercase tracking-wider mb-2">Método de pago</p>
                <div className="flex gap-2 flex-wrap">
                  {paymentMethods.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentId(method.id)}
                      className={cn(
                        'px-3 py-2 rounded-lg border font-semibold text-sm transition-all whitespace-nowrap',
                        selectedPaymentId === method.id
                          ? 'bg-[#092B2B] text-white border-[#092B2B]'
                          : 'bg-white border-[#092B2B]/20 text-[#092B2B]/60 hover:border-[#092B2B]/40 hover:text-[#092B2B]'
                      )}
                    >
                      {method.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <p className="text-xs font-semibold text-[#092B2B]/50 uppercase tracking-wider mb-2">Notas</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas para la orden (opcional)"
                  className="w-full min-h-64px p-2 rounded-md border border-[#092B2B]/10 text-sm resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-[#092B2B]/20 text-[#092B2B] hover:bg-[#092B2B]/5"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={!selectedPaymentId || isProcessing}
                  className="flex-1 bg-[#092B2B] hover:bg-[#092B2B]/85 text-white font-semibold"
                >
                  Procesar venta
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Confirmación
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#092B2B]/10 flex items-center justify-center mb-4">
              <Copy className="h-8 w-8 text-[#092B2B]" />
            </div>
            <h3 className="text-lg font-semibold text-[#092B2B] mb-2">¿Confirmar venta?</h3>
            <p className="text-sm text-[#092B2B]/60 mb-4">
              {cartItemCount} artículos por {formatCurrency(cartTotal)}
            </p>
            <p className="text-xs font-medium text-[#092B2B]/50 mb-2">
              Método: <span className="text-[#092B2B]">{paymentMethods.find(m => m.id === selectedPaymentId)?.nombre || 'N/A'}</span>
            </p>
            {notes && (
              <p className="text-xs text-[#092B2B]/60 mb-4">Notas: <span className="text-[#092B2B] font-medium">{notes}</span></p>
            )}

            <div className="flex gap-3 w-full">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                className="flex-1 border-[#092B2B]/20 text-[#092B2B]"
              >
                Atrás
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="flex-1 bg-[#092B2B] hover:bg-[#092B2B]/85 text-white flex items-center justify-center gap-2"
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                {isProcessing ? 'Procesando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
