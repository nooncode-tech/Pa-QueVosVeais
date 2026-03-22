'use client'

import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Clock, Users, Utensils, BarChart3 } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/store'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts'

type DateRange = 'today' | 'week' | 'month'

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
}

function getRangeStart(range: DateRange): Date {
  const d = new Date()
  if (range === 'today') {
    d.setHours(0, 0, 0, 0)
  } else if (range === 'week') {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
  } else {
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
  }
  return d
}

interface HistoricalDay {
  day: string
  ventas: number
  pedidos: number
}

interface OrderRow {
  id: string
  status: string
  canal: string
  mesa: number | null
  items: Array<{ menuItem: { id: string; nombre: string; precio: number }; cantidad: number; extras?: Array<{ precio: number }> }>
  created_at: string
  tiempo_inicio_preparacion: string | null
  tiempo_fin_preparacion: string | null
}

export function ReportsManager() {
  const { orders, tableSessions } = useApp()
  const [range, setRange] = useState<DateRange>('today')
  const [historicalData, setHistoricalData] = useState<HistoricalDay[]>([])
  const [peakHoursData, setPeakHoursData] = useState<{ hora: string; pedidos: number }[]>([])
  const [prevRevenue, setPrevRevenue] = useState<number | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const rangeStart = useMemo(() => getRangeStart(range), [range])

  // Load historical completed orders from Supabase for charts
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true)
      const since = new Date()

      if (range === 'today') {
        since.setHours(0, 0, 0, 0)
      } else if (range === 'week') {
        since.setDate(since.getDate() - 6)
        since.setHours(0, 0, 0, 0)
      } else {
        since.setDate(1)
        since.setHours(0, 0, 0, 0)
      }

      const { data, error } = await supabase
        .from('orders')
        .select('id, status, items, created_at')
        .eq('status', 'entregado')
        .gte('created_at', since.toISOString())
        .order('created_at')

      if (error || !data) { setLoadingHistory(false); return }

      // Group by day
      const byDay: Record<string, { ventas: number; pedidos: number }> = {}
      for (const row of data as OrderRow[]) {
        const day = new Date(row.created_at).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
        if (!byDay[day]) byDay[day] = { ventas: 0, pedidos: 0 }
        const total = (row.items ?? []).reduce((sum: number, item) => {
          const extrasTotal = (item.extras ?? []).reduce((e: number, ex) => e + ex.precio, 0)
          return sum + (item.menuItem.precio + extrasTotal) * item.cantidad
        }, 0)
        byDay[day].ventas += total
        byDay[day].pedidos += 1
      }

      setHistoricalData(Object.entries(byDay).map(([day, v]) => ({ day, ...v })))

      // Peak hours: count orders by hour
      const byHour: Record<number, number> = {}
      for (const row of data as OrderRow[]) {
        const h = new Date(row.created_at).getHours()
        byHour[h] = (byHour[h] ?? 0) + 1
      }
      const hoursArr = Array.from({ length: 24 }, (_, h) => ({
        hora: `${String(h).padStart(2, '0')}h`,
        pedidos: byHour[h] ?? 0,
      })).filter(h => h.pedidos > 0)
      setPeakHoursData(hoursArr)

      // Previous period for comparison
      const prevEnd = new Date(since)
      const prevStart = new Date(since)
      const periodMs = Date.now() - since.getTime()
      prevStart.setTime(since.getTime() - periodMs)

      const { data: prevData } = await supabase
        .from('orders')
        .select('id, items')
        .eq('status', 'entregado')
        .gte('created_at', prevStart.toISOString())
        .lt('created_at', prevEnd.toISOString())

      if (prevData) {
        const prevRev = (prevData as OrderRow[]).reduce((sum, row) =>
          sum + (row.items ?? []).reduce((s, item) => {
            const extrasTotal = (item.extras ?? []).reduce((e, ex) => e + ex.precio, 0)
            return s + (item.menuItem.precio + extrasTotal) * item.cantidad
          }, 0), 0)
        setPrevRevenue(prevRev)
      }

      setLoadingHistory(false)
    }

    loadHistory()
  }, [range])

  // Active orders from context (non-delivered) + completed from Supabase in historical
  const rangeOrders = useMemo(
    () => orders.filter(o => new Date(o.createdAt) >= rangeStart),
    [orders, rangeStart]
  )
  const completedOrders = useMemo(
    () => rangeOrders.filter(o => o.status === 'entregado'),
    [rangeOrders]
  )

  const totalRevenue = useMemo(() => {
    // Use historical data total when available (includes DB-persisted completed orders)
    if (historicalData.length > 0) {
      return historicalData.reduce((sum, d) => sum + d.ventas, 0)
    }
    return completedOrders.reduce((sum, order) =>
      sum + order.items.reduce((s, item) => {
        const extrasTotal = item.extras?.reduce((e, ex) => e + ex.precio, 0) || 0
        return s + (item.menuItem.precio + extrasTotal) * item.cantidad
      }, 0), 0)
  }, [completedOrders, historicalData])

  const totalCompletedOrders = useMemo(() => {
    if (historicalData.length > 0) return historicalData.reduce((sum, d) => sum + d.pedidos, 0)
    return completedOrders.length
  }, [completedOrders, historicalData])

  const totalItems = useMemo(() => completedOrders.reduce((sum, order) =>
    sum + order.items.reduce((s, item) => s + item.cantidad, 0), 0), [completedOrders])

  const avgOrderValue = totalCompletedOrders > 0 ? totalRevenue / totalCompletedOrders : 0

  const ordersWithTimes = completedOrders.filter(o => o.tiempoInicioPreparacion && o.tiempoFinPreparacion)
  const avgPrepTime = ordersWithTimes.length > 0
    ? ordersWithTimes.reduce((sum, o) => {
        const start = new Date(o.tiempoInicioPreparacion!).getTime()
        const end = new Date(o.tiempoFinPreparacion!).getTime()
        return sum + (end - start) / 1000 / 60
      }, 0) / ordersWithTimes.length
    : 0

  const ordersByChannel = {
    mesa: rangeOrders.filter(o => o.canal === 'mesa' || o.canal === 'mesero').length,
    para_llevar: rangeOrders.filter(o => o.canal === 'para_llevar').length,
    delivery: rangeOrders.filter(o => o.canal === 'delivery').length,
  }

  const itemCounts: Record<string, { nombre: string; count: number; revenue: number }> = {}
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const key = item.menuItem.id
      if (!itemCounts[key]) itemCounts[key] = { nombre: item.menuItem.nombre, count: 0, revenue: 0 }
      itemCounts[key].count += item.cantidad
      itemCounts[key].revenue += item.menuItem.precio * item.cantidad
    })
  })
  const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5)

  const activeTables = tableSessions.filter(s => s.activa).length

  const today = new Date()

  // Chart color
  const chartColor = 'hsl(var(--primary))'

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Reportes
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Range selector */}
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

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-primary">{formatPrice(totalRevenue)}</p>
                <p className="text-[9px] text-muted-foreground">Ventas {RANGE_LABELS[range].toLowerCase()}</p>
              </div>
              {prevRevenue !== null && prevRevenue > 0 && (() => {
                const pct = ((totalRevenue - prevRevenue) / prevRevenue) * 100
                const up = pct >= 0
                return (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {up ? '↑' : '↓'}{Math.abs(pct).toFixed(0)}%
                  </span>
                )
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-success" />
              <div>
                <p className="text-lg font-bold text-success">{totalCompletedOrders}</p>
                <p className="text-[9px] text-muted-foreground">Pedidos completados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-lg font-bold text-amber-600">{avgPrepTime.toFixed(0)} min</p>
                <p className="text-[9px] text-muted-foreground">Tiempo prom. prep.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-lg font-bold text-blue-600">{activeTables}</p>
                <p className="text-[9px] text-muted-foreground">Mesas activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      {historicalData.length > 1 && (
        <Card className="mb-3">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Ventas por día
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={historicalData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => [formatPrice(value), 'Ventas']}
                />
                <Bar dataKey="ventas" fill={chartColor} radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Peak Hours Chart */}
      {peakHoursData.length > 0 && (
        <Card className="mb-3">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Horas pico
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={peakHoursData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <XAxis dataKey="hora" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} formatter={(v: number) => [v, 'Pedidos']} />
                <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {loadingHistory && historicalData.length === 0 && (
        <Card className="mb-3">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Cargando datos históricos...</p>
          </CardContent>
        </Card>
      )}

      {/* Orders by Channel */}
      <Card className="mb-3">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-xs">Pedidos por canal</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            {[
              { label: 'En mesa', count: ordersByChannel.mesa, color: 'bg-primary' },
              { label: 'Para llevar', count: ordersByChannel.para_llevar, color: 'bg-amber-500' },
              { label: 'Delivery', count: ordersByChannel.delivery, color: 'bg-success' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${(count / Math.max(rangeOrders.length, 1)) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Items */}
      <Card className="mb-3">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Utensils className="h-3.5 w-3.5" />
            Platillos mas vendidos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {topItems.length > 0 ? (
            <div className="space-y-2">
              {topItems.map((item, index) => (
                <div key={item.nombre} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      index === 0 ? 'bg-primary text-primary-foreground' :
                      index === 1 ? 'bg-amber-500 text-white' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-secondary text-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-xs text-foreground truncate max-w-[120px]">{item.nombre}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-foreground">{item.count} uds</span>
                    <span className="text-[9px] text-muted-foreground block">{formatPrice(item.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sin ventas en este período
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-sm font-bold text-foreground">{formatPrice(avgOrderValue)}</p>
            <p className="text-[9px] text-muted-foreground">Ticket promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-sm font-bold text-foreground">{totalItems}</p>
            <p className="text-[9px] text-muted-foreground">Platillos vendidos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
