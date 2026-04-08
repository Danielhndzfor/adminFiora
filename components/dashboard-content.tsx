'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Banknote, CreditCard, Wallet, AlertTriangle, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function getStockColor(stock: number) {
  if (stock <= 1) return 'text-stock-low bg-stock-low/10'
  if (stock <= 3) return 'text-stock-medium bg-stock-medium/10'
  return 'text-stock-high bg-stock-high/10'
}

export function DashboardContent() {
  const { getDashboardMetrics, currentBranch } = useStore()
  const metrics = getDashboardMetrics()
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* Branch indicator */}
      {currentBranch && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span>{currentBranch.name}</span>
        </div>
      )}

      {/* Main metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="col-span-2 bg-primary text-primary-foreground">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm opacity-90">Ventas de hoy</p>
              <p className="text-3xl font-bold tracking-tight">{formatCurrency(metrics.totalRevenue)}</p>
              <p className="text-sm opacity-75 mt-1">{metrics.todaySales} transacciones</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <TrendingUp className="h-7 w-7" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <Banknote className="h-4 w-4 text-success" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Efectivo</p>
            <p className="text-xl font-bold">{formatCurrency(metrics.salesByCash)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-chart-2" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Transferencia</p>
            <p className="text-xl font-bold">{formatCurrency(metrics.salesByTransfer)}</p>
          </CardContent>
        </Card>

        {metrics.salesByOther > 0 && (
          <Card className="col-span-2">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Otros metodos</p>
                  <p className="text-lg font-bold">{formatCurrency(metrics.salesByOther)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top products */}
      {metrics.topProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Mas vendidos hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-2">
              {metrics.topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-5">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.count} {product.count === 1 ? 'venta' : 'ventas'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low stock alerts */}
      {metrics.lowStockProducts.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-2">
              {metrics.lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-2 border-b border-warning/20 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    getStockColor(product.stock)
                  )}>
                    {product.stock} {product.stock === 1 ? 'unidad' : 'unidades'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick stats summary */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          {lastUpdated ? `Ultimo actualizado: ${lastUpdated}` : '\u00A0'}
        </p>
      </div>
    </div>
  )
}
