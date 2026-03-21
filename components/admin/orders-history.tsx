'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatPrice, getChannelLabel, type OrderItem } from '@/lib/store'
import { cn } from '@/lib/utils'

type DateRange = 'today' | 'week' | 'month'

interface HistoricalOrder {
  id: string
  numero: number
  canal: string
  mesa: number | null
  nombreCliente: string | null
  status: string
  items: OrderItem[]
  costoEnvio: number
  createdAt: string
}

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
}

function getRangeSince(range: DateRange): string {
  const d = new Date()
  if (range === 'today') {
    d.setHours(0, 0, 0, 0)
  } else if (range === 'week') {
    d.setDate(d.getDate() - 6)
    d.setHours(0, 0, 0, 0)
  } else {
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
  }
  return d.toISOString()
}

function orderTotal(order: HistoricalOrder): number {
  return (order.items ?? []).reduce((sum, item) => {
    const extras = (item.extras ?? []).reduce((e, ex) => e + ex.precio, 0)
    return sum + (item.menuItem.precio + extras) * item.cantidad
  }, 0) + (order.costoEnvio ?? 0)
}

const PAGE_SIZE = 50

export function OrdersHistory() {
  const [range, setRange] = useState<DateRange>('today')
  const [orders, setOrders] = useState<HistoricalOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const mapRow = (row: Record<string, unknown>): HistoricalOrder => ({
    id: row.id as string,
    numero: (row.numero as number) ?? 0,
    canal: row.canal as string,
    mesa: (row.mesa as number) ?? null,
    nombreCliente: (row.nombre_cliente as string) ?? null,
    status: row.status as string,
    items: (row.items as OrderItem[]) ?? [],
    costoEnvio: Number(row.costo_envio) ?? 0,
    createdAt: row.created_at as string,
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setOrders([])
      const { data, error } = await supabase
        .from('orders')
        .select('id, numero, canal, mesa, nombre_cliente, status, items, costo_envio, created_at')
        .in('status', ['entregado', 'cancelado'])
        .gte('created_at', getRangeSince(range))
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1)

      if (!error && data) {
        setHasMore(data.length > PAGE_SIZE)
        setOrders(data.slice(0, PAGE_SIZE).map(mapRow))
      }
      setLoading(false)
    }
    load()
  }, [range])

  const loadMore = async () => {
    if (!orders.length) return
    setLoadingMore(true)
    const lastCreatedAt = orders[orders.length - 1].createdAt
    const { data, error } = await supabase
      .from('orders')
      .select('id, numero, canal, mesa, nombre_cliente, status, items, costo_envio, created_at')
      .in('status', ['entregado', 'cancelado'])
      .gte('created_at', getRangeSince(range))
      .lt('created_at', lastCreatedAt)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1)

    if (!error && data) {
      setHasMore(data.length > PAGE_SIZE)
      setOrders(prev => [...prev, ...data.slice(0, PAGE_SIZE).map(mapRow)])
    }
    setLoadingMore(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(o =>
      String(o.numero).includes(q) ||
      (o.nombreCliente?.toLowerCase().includes(q)) ||
      getChannelLabel(o.canal as never).toLowerCase().includes(q)
    )
  }, [orders, search])

  const totalRevenue = useMemo(
    () => filtered.filter(o => o.status === 'entregado').reduce((sum, o) => sum + orderTotal(o), 0),
    [filtered]
  )

  return (
    <div className="p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xs font-semibold text-foreground">Historial de Pedidos</h2>
          <p className="text-[10px] text-muted-foreground">
            {loading ? 'Cargando...' : `${filtered.length} pedidos · ${formatPrice(totalRevenue)} en ventas`}
          </p>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-[10px] font-medium">
          {(['today', 'week', 'month'] as DateRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-2.5 py-1.5 transition-colors',
                range === r ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-secondary'
              )}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nro, cliente, canal..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* List */}
      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-8">Cargando historial...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Sin pedidos en este período</p>
      ) : (
        <div className="space-y-1.5">
          {(search ? filtered : orders).map(order => {
            const isExpanded = expandedId === order.id
            const total = orderTotal(order)
            const isDelivered = order.status === 'entregado'
            const time = new Date(order.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
            const dateStr = new Date(order.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent
                  className="p-2.5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isDelivered
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                        : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      }
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">#{order.numero}</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal">
                            {getChannelLabel(order.canal as never)}
                          </Badge>
                          {order.mesa && (
                            <span className="text-[10px] text-muted-foreground">Mesa {order.mesa}</span>
                          )}
                          {order.nombreCliente && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{order.nombreCliente}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">{dateStr} {time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-xs font-semibold', isDelivered ? 'text-foreground' : 'text-muted-foreground line-through')}>
                        {formatPrice(total)}
                      </span>
                      {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded items */}
                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-border space-y-1">
                      {(order.items ?? []).map((item, i) => (
                        <div key={i} className="flex justify-between items-start text-[10px]">
                          <span className="text-muted-foreground">
                            {item.cantidad}× {item.menuItem.nombre}
                            {item.extras && item.extras.length > 0 && (
                              <span className="text-[9px] ml-1 text-muted-foreground/70">
                                (+{item.extras.map(e => e.nombre).join(', ')})
                              </span>
                            )}
                          </span>
                          <span className="font-medium">
                            {formatPrice((item.menuItem.precio + (item.extras?.reduce((s, e) => s + e.precio, 0) ?? 0)) * item.cantidad)}
                          </span>
                        </div>
                      ))}
                      {order.costoEnvio > 0 && (
                        <div className="flex justify-between text-[10px] pt-1 border-t border-border">
                          <span className="text-muted-foreground">Envío</span>
                          <span>{formatPrice(order.costoEnvio)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {!search && hasMore && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs mt-1"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Cargar más
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
