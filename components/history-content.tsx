'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Banknote, CreditCard, Wallet, Trash2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Sale } from '@/lib/types'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function getPaymentIcon(method: string) {
  switch (method) {
    case 'cash':
      return <Banknote className="h-4 w-4 text-success" />
    case 'transfer':
      return <CreditCard className="h-4 w-4 text-chart-2" />
    default:
      return <Wallet className="h-4 w-4 text-muted-foreground" />
  }
}

function getPaymentLabel(method: string) {
  switch (method) {
    case 'cash':
      return 'Efectivo'
    case 'transfer':
      return 'Transferencia'
    default:
      return 'Otro'
  }
}

type DateFilter = 'today' | 'week' | 'all'

export function HistoryContent() {
  const { sales, deleteSale } = useStore()
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.createdAt)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (dateFilter === 'today') {
      return saleDate >= today
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return saleDate >= weekAgo
    }
    return true
  })

  // Group sales by date
  const groupedSales: Record<string, Sale[]> = {}
  filteredSales.forEach((sale) => {
    const dateKey = formatDate(sale.createdAt)
    if (!groupedSales[dateKey]) {
      groupedSales[dateKey] = []
    }
    groupedSales[dateKey].push(sale)
  })

  const handleDelete = (sale: Sale) => {
    setDeletingId(sale.id)
  }

  const confirmDelete = () => {
    if (deletingId) {
      deleteSale(deletingId)
      toast.success('Venta eliminada')
      setDeletingId(null)
    }
  }

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.price, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Date filters */}
      <div className="flex gap-2">
        {[
          { key: 'today', label: 'Hoy' },
          { key: 'week', label: 'Semana' },
          { key: 'all', label: 'Todo' },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={dateFilter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilter(key as DateFilter)}
            className="flex-1"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total del periodo</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{filteredSales.length}</p>
            <p className="text-xs text-muted-foreground">ventas</p>
          </div>
        </CardContent>
      </Card>

      {/* Sales timeline */}
      {Object.keys(groupedSales).length > 0 ? (
        <div className="flex flex-col gap-4">
          {Object.entries(groupedSales).map(([date, daySales]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
              </div>
              <div className="flex flex-col gap-2">
                {daySales.map((sale) => (
                  <Card key={sale.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 p-3">
                        {/* Product image */}
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-primary/30" />
                        </div>

                        {/* Sale info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{sale.productName}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {getPaymentIcon(sale.paymentMethod)}
                            <span className="text-xs text-muted-foreground">
                              {getPaymentLabel(sale.paymentMethod)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {mounted ? formatTime(sale.createdAt) : '--:--'}
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className={cn(
                            'font-bold',
                            sale.price !== sale.originalPrice && 'text-warning'
                          )}>
                            {formatCurrency(sale.price)}
                          </p>
                          {sale.price !== sale.originalPrice && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatCurrency(sale.originalPrice)}
                            </p>
                          )}
                        </div>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(sale)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Sync indicator */}
                      {!sale.synced && (
                        <div className="bg-warning/10 px-3 py-1 text-xs text-warning">
                          Pendiente de sincronizar
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No hay ventas en este periodo</p>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-card rounded-t-2xl p-4 pb-safe animate-in slide-in-from-bottom duration-200">
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Eliminar venta</h2>
              <p className="text-muted-foreground text-sm mb-6">
                El stock del producto sera restaurado.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeletingId(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={confirmDelete}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
