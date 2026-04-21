'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TrendingUp, Banknote, CreditCard, Wallet,
  AlertTriangle, Package, Calendar, Receipt, ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function getStockColor(stock: number) {
  if (stock <= 1) return 'text-red-600 bg-red-50 dark:bg-red-950/30'
  if (stock <= 3) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30'
  return 'text-green-600 bg-green-50 dark:bg-green-950/30'
}

interface DashboardMetrics {
  totalRevenue: number
  ticketCount: number
  avgTicket: number
  maxTicket: number
  salesByPayment: Record<string, number>
  salesByPaymentId: Record<number, number>
  topProducts: { name: string; count: number }[]
  lowStockProducts: { id: number; nombre: string; stock: number }[]
}

function MetricsView({ queryString }: { queryString: string }) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/dashboard/metrics?${queryString}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setMetrics(data); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [queryString])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const salesByPaymentId = metrics?.salesByPaymentId ?? {}
  const salesByCash = salesByPaymentId[1] ?? 0
  const salesByTransfer = salesByPaymentId[2] ?? 0
  const otherPaymentIds = Object.keys(salesByPaymentId)
    .map(Number)
    .filter((id) => ![1, 2].includes(id))
  const salesByOther = otherPaymentIds.reduce((sum, id) => sum + (salesByPaymentId[id] ?? 0), 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Main revenue */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm opacity-90">Total del periodo</p>
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(metrics?.totalRevenue ?? 0)}</p>
            <p className="text-sm opacity-75 mt-1">{metrics?.ticketCount ?? 0} tickets completados</p>
          </div>
          <div className="h-14 w-14 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <TrendingUp className="h-7 w-7" />
          </div>
        </CardContent>
      </Card>

      {/* Payment methods */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mb-2">
              <Banknote className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground">Efectivo</p>
            <p className="text-xl font-bold">{formatCurrency(salesByCash)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center mb-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground">Transferencia</p>
            <p className="text-xl font-bold">{formatCurrency(salesByTransfer)}</p>
          </CardContent>
        </Card>
        {salesByOther > 0 && (
          <Card className="col-span-2">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Otros métodos</p>
                <p className="text-lg font-bold">{formatCurrency(salesByOther)}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top 5 products */}
      {(metrics?.topProducts?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top productos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {metrics!.topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-muted-foreground w-5 shrink-0">{index + 1}.</span>
                  <span className="text-sm font-medium truncate">{product.name}</span>
                </div>
                <span className="text-sm text-muted-foreground shrink-0 ml-2">
                  {product.count} {product.count === 1 ? 'venta' : 'ventas'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Low stock */}
      {(metrics?.lowStockProducts?.length ?? 0) > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              Stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {metrics!.lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between py-2 border-b border-yellow-200/50 dark:border-yellow-900/20 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{product.nombre}</span>
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', getStockColor(product.stock))}>
                  {product.stock} {product.stock === 1 ? 'unidad' : 'unidades'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function DashboardContent() {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [activeTab, setActiveTab] = useState('today')

  const years = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => today.getFullYear() - i),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const dayQuery = useMemo(() => `date=${selectedDate}`, [selectedDate])
  const monthQuery = useMemo(
    () => `month=${selectedMonth}&year=${selectedYear}`,
    [selectedMonth, selectedYear]
  )

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="today" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="month">Mes</TabsTrigger>
        </TabsList>

        {/* ---- HOY ---- */}
        <TabsContent value="today" className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
            />
          </div>
          <MetricsView queryString={dayQuery} />
          
        </TabsContent>

        {/* ---- MES ---- */}
        <TabsContent value="month" className="mt-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecciona mes" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y.toString()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <MetricsView queryString={monthQuery} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
