'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Banknote, CreditCard, Wallet, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface ApiTicket {
  ticketId: string
  ordenId: number
  createdAt: Date
  userId: number
  userName: string
  paymentMethod: string
  items: Array<{
    id: string
    productName: string
    productImage: string
    quantity: number
    price: number
    originalPrice: number
    createdAt: Date
  }>
  total: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatTime(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleTimeString('es-MX', {
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

function formatDateFull(date: Date) {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

type FilterMode = 'today' | 'date' | 'week' | 'all'

interface Ticket {
  ticketId: string
  ordenId: number
  createdAt: Date | string
  userId: number
  userName: string
  items: Array<{
    id: string
    productName: string
    productImage: string
    quantity: number
    price: number
    originalPrice: number
    createdAt: Date | string
  }>
  total: number
  paymentMethod: string
  estatusId: number
  estatusNombre: string
}

export function HistoryContent() {
  const [filterMode, setFilterMode] = useState<FilterMode>('today')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(getWeekStart(new Date()).toISOString().split('T')[0])
  const [mounted, setMounted] = useState(false)
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [estatusList, setEstatusList] = useState<{ id: number; nombre: string }[]>([])
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [skip, setSkip] = useState(0)
  const take = 25
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // Fetch tickets desde la API
  // Fetch function usable by effects and observer
  async function fetchTickets(reset = true) {
    if (reset) {
      setLoading(true)
      setSkip(0)
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams()

      if (filterMode === 'date') {
        params.append('date', selectedDate)
      } else if (filterMode === 'week') {
        params.append('weekStart', selectedWeekStart)
      } else if (filterMode === 'all') {
        params.append('all', 'true')
      }

      params.append('skip', String(reset ? 0 : skip))
      params.append('take', String(take))

      const res = await fetch(`/api/orders/tickets?${params.toString()}`)
      if (!res.ok) throw new Error('Error al obtener órdenes')

      const data = await res.json()
      const received: Ticket[] = data.tickets || []

      if (reset) {
        setTickets(received)
        setSkip(received.length)
      } else {
        setTickets((prev) => [...prev, ...received])
        setSkip((prev) => prev + received.length)
      }

      if (received.length < take) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Error al cargar las órdenes')
      if (reset) setTickets([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    // Reset and load first page when filter changes
    fetchTickets(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode, selectedDate, selectedWeekStart])

  // IntersectionObserver: cargar más cuando el sentinel aparece
  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !loading && !loadingMore && hasMore) {
          fetchTickets(false)
        }
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, loading, loadingMore, hasMore])

  useEffect(() => {
    setMounted(true)
    // Cargar lista de estatus para el selector
    fetch('/api/catalogos/estatus')
      .then((r) => r.json())
      .then((d) => setEstatusList(d.data ?? []))
      .catch(() => {})
  }, [])

  async function updateTicketStatus(ordenId: number, idEstatus: number) {
    setUpdatingStatus((prev) => new Set(prev).add(ordenId))
    try {
      const res = await fetch(`/api/orders/${ordenId}/update-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idEstatus }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Errores específicos de validación o transacción
        const errorMsg = data.error || 'Error al actualizar estatus'
        
        // Mostrar mensajes más descriptivos
        if (data.code === 'VALIDATION_ERROR') {
          toast.error(`⚠️ ${errorMsg}`)
        } else if (data.code === 'TRANSACTION_FAILED') {
          toast.error(`❌ Error de transacción: ${errorMsg}. La operación fue revertida.`)
        } else {
          toast.error(errorMsg)
        }
        return
      }

      // Actualizar UI con los nuevos datos
      const updatedOrden = data.orden
      setTickets((prev) =>
        prev.map((t) =>
          t.ordenId === ordenId
            ? {
                ...t,
                estatusId: updatedOrden.idEstatus,
                estatusNombre: updatedOrden.estatus?.nombre ?? t.estatusNombre,
              }
            : t
        )
      )
      toast.success('Estatus actualizado y stock ajustado')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error de conexión al actualizar estatus')
    } finally {
      setUpdatingStatus((prev) => { const s = new Set(prev); s.delete(ordenId); return s })
    }
  }

  function toggleTicket(ticketId: string) {
    const newSet = new Set(expandedTickets)
    if (newSet.has(ticketId)) {
      newSet.delete(ticketId)
    } else {
      newSet.add(ticketId)
    }
    setExpandedTickets(newSet)
  }

  // Total solo cuenta tickets con idEstatus === 1
  const totalRevenue = tickets.filter((t) => t.estatusId === 1).reduce((sum, t) => sum + t.total, 0)
  const totalCount = tickets.filter((t) => t.estatusId === 1).length

  return (
    <div className="flex flex-col gap-4">
      {/* Filter modes */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterMode === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterMode('today')}
        >
          Hoy
        </Button>
        <Button
          variant={filterMode === 'date' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterMode('date')}
        >
          Fecha
        </Button>
        <Button
          variant={filterMode === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterMode('week')}
        >
          Semana
        </Button>
        <Button
          variant={filterMode === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterMode('all')}
        >
          Todo
        </Button>
      </div>

      {/* Date/Week pickers */}
      {filterMode === 'date' && (
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
          />
        </div>
      )}

      {filterMode === 'week' && (
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedWeekStart}
            onChange={(e) => setSelectedWeekStart(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
          />
          <span className="text-xs text-muted-foreground self-center whitespace-nowrap">
            {filterMode === 'week' && selectedWeekStart && (
              <>
                {new Date(selectedWeekStart).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} -{' '}
                {new Date(new Date(selectedWeekStart).setDate(new Date(selectedWeekStart).getDate() + 6)).toLocaleDateString(
                  'es-MX',
                  { day: 'numeric', month: 'short' }
                )}
              </>
            )}
          </span>
        </div>
      )}

      {/* Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total del periodo</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{totalCount}</p>
            <p className="text-xs text-muted-foreground">tickets activos</p>
          </div>
        </CardContent>
      </Card>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
        </div>
      )}

      {/* Orders timeline */}
      {!loading && tickets.length > 0 ? (
        <div className="flex flex-col gap-2">
          {tickets.map((ticket) => (
            <div key={ticket.ticketId}>
              <Card className="cursor-pointer hover:bg-accent/50 transition" onClick={() => toggleTicket(ticket.ticketId)}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    {/* Header */}
                    <div className="flex-1 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {getPaymentIcon(ticket.paymentMethod)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm truncate">#{ticket.ticketId}</h4>
                          <span className="text-xs text-muted-foreground">{ticket.items.length} items</span>
                          <Badge
                            variant={ticket.estatusId === 1 ? 'default' : 'secondary'}
                            className="text-xs px-1.5 py-0"
                          >
                            {ticket.estatusNombre}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ticket.userName} • {mounted ? formatTime(ticket.createdAt) : '--:--'}
                        </p>
                      </div>
                    </div>

                    {/* Total and expand */}
                    <div className="text-right flex items-center gap-2">
                      <p className="font-bold text-sm">{formatCurrency(ticket.total)}</p>
                      {expandedTickets.has(ticket.ticketId) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedTickets.has(ticket.ticketId) && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {/* Selector de estatus */}
                      {estatusList.length > 0 && (
                        <div className="flex items-center gap-2 pb-2">
                          <span className="text-xs text-muted-foreground">Cambiar estatus:</span>
                          <Select
                            value={String(ticket.estatusId)}
                            onValueChange={(val) => updateTicketStatus(ticket.ordenId, parseInt(val))}
                            disabled={updatingStatus.has(ticket.ordenId)}
                          >
                            <SelectTrigger className="h-7 text-xs w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {estatusList.map((e) => (
                                <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {ticket.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item.productName} {item.quantity > 1 && `(x${item.quantity})`}
                            </p>
                            <p className="text-xs text-muted-foreground">{getPaymentLabel(ticket.paymentMethod)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-right w-16">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No hay órdenes en este periodo</p>
        </div>
      ) : null }

      {/* Note: Delete functionality removed for database records */}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} />

      {loadingMore && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      )}
    </div>
  )
}

// Intersection observer to load more when sentinel visible
export default function HistoryContentWrapper() {
  return <HistoryContent />
}
