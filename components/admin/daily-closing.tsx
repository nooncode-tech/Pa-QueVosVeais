'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useApp } from '@/lib/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  Download,
  Printer,
  CreditCard,
  Banknote,
  XCircle,
  Loader2,
} from 'lucide-react'
import {
  formatPrice,
  calculateOrderTotal,
  getChannelLabel,
  getPaymentMethodLabel,
  type Order,
  type TableSession,
  type Refund,
  type PaymentMethod,
  type OrderItem,
} from '@/lib/store'
import { supabase } from '@/lib/supabase'

export function DailyClosing() {
  const { logAction } = useApp()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  // ── Load data from Supabase for any selected date ──────────────────────────
  const [loading, setLoading] = useState(false)
  const [dayOrders, setDayOrders] = useState<Order[]>([])
  const [daySessions, setDaySessions] = useState<TableSession[]>([])
  const [dayRefunds, setDayRefunds] = useState<Refund[]>([])

  // Cash denomination counting
  const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1]
  const [billCounts, setBillCounts] = useState<Record<number, string>>(
    Object.fromEntries(DENOMINATIONS.map(d => [d, '']))
  )
  const cashTotal = DENOMINATIONS.reduce((sum, d) => sum + d * (parseInt(billCounts[d]) || 0), 0)

  useEffect(() => {
    const loadDay = async () => {
      setLoading(true)
      const start = `${selectedDate}T00:00:00.000Z`
      const end   = `${selectedDate}T23:59:59.999Z`

      const [ordersRes, sessionsRes, refundsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at'),
        supabase
          .from('table_sessions')
          .select('*')
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at'),
        supabase
          .from('refunds')
          .select('*')
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at'),
      ])

      if (ordersRes.data) {
        setDayOrders(ordersRes.data.map(row => ({
          id: row.id as string,
          numero: (row.numero as number) ?? 0,
          canal: row.canal as Order['canal'],
          mesa: (row.mesa as number) ?? undefined,
          items: (row.items as OrderItem[]) ?? [],
          status: row.status as Order['status'],
          cocinaAStatus: (row.cocina_a_status as Order['cocinaAStatus']) ?? 'en_cola',
          cocinaBStatus: (row.cocina_b_status as Order['cocinaBStatus']) ?? 'en_cola',
          nombreCliente: (row.nombre_cliente as string) ?? undefined,
          telefono: (row.telefono as string) ?? undefined,
          direccion: (row.direccion as string) ?? undefined,
          zonaReparto: (row.zona_reparto as string) ?? undefined,
          costoEnvio: row.costo_envio ? Number(row.costo_envio) : undefined,
          cancelado: (row.cancelado as boolean) ?? false,
          cancelReason: row.cancel_reason as Order['cancelReason'],
          cancelMotivo: (row.cancel_motivo as string) ?? undefined,
          tiempoInicioPreparacion: row.tiempo_inicio_preparacion ? new Date(row.tiempo_inicio_preparacion as string) : undefined,
          tiempoFinPreparacion: row.tiempo_fin_preparacion ? new Date(row.tiempo_fin_preparacion as string) : undefined,
          createdAt: new Date(row.created_at as string),
          updatedAt: new Date(row.updated_at as string),
        })))
      }

      if (sessionsRes.data) {
        setDaySessions(sessionsRes.data.map(row => ({
          id: row.id as string,
          mesa: row.mesa as number,
          activa: row.activa as boolean,
          orders: [],
          createdAt: new Date(row.created_at as string),
          expiresAt: row.expires_at ? new Date(row.expires_at as string) : new Date(),
          deviceId: (row.device_id as string) ?? '',
          billStatus: row.bill_status as TableSession['billStatus'],
          subtotal: Number(row.subtotal) ?? 0,
          impuestos: Number(row.impuestos) ?? 0,
          propina: Number(row.propina) ?? 0,
          descuento: Number(row.descuento) ?? 0,
          descuentoMotivo: (row.descuento_motivo as string) ?? undefined,
          total: Number(row.total) ?? 0,
          paymentMethod: (row.payment_method as TableSession['paymentMethod']) ?? undefined,
          paymentStatus: row.payment_status as TableSession['paymentStatus'],
          paidAt: row.paid_at ? new Date(row.paid_at as string) : undefined,
        })))
      }

      if (refundsRes.data) {
        setDayRefunds(refundsRes.data.map(row => ({
          id: row.id as string,
          orderId: row.order_id as string,
          sessionId: (row.session_id as string) ?? undefined,
          monto: Number(row.monto),
          motivo: row.motivo as string,
          tipo: row.tipo as Refund['tipo'],
          itemsReembolsados: (row.items_reembolsados as string[]) ?? undefined,
          inventarioRevertido: row.inventario_revertido as boolean,
          userId: row.user_id as string,
          createdAt: new Date(row.created_at as string),
        })))
      }

      setLoading(false)
    }

    loadDay()
  }, [selectedDate])

  // Paid sessions for the day (payment method breakdown)
  const dayPayments = useMemo(
    () => daySessions.filter(s => s.paymentStatus === 'pagado'),
    [daySessions]
  )
  
  // Calculate stats
  const stats = useMemo(() => {
    const completedOrders = dayOrders.filter(o => o.status === 'entregado')
    const cancelledOrders = dayOrders.filter(o => o.status === 'cancelado')
    
    // Sales by channel
    const salesByChannel = dayOrders.reduce((acc, order) => {
      if (order.status !== 'entregado') return acc
      const total = calculateOrderTotal(order.items)
      acc[order.canal] = (acc[order.canal] || 0) + total
      return acc
    }, {} as Record<string, number>)
    
    // Sales by payment method from paid sessions
    const salesByPayment = dayPayments.reduce((acc, payment) => {
      acc[payment.paymentMethod ?? 'efectivo'] = (acc[payment.paymentMethod ?? 'efectivo'] || 0) + payment.total
      return acc
    }, {} as Record<string, number>)
    
    // Top selling items
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.menuItem.id
        if (!itemSales[key]) {
          itemSales[key] = { name: item.menuItem.nombre, quantity: 0, revenue: 0 }
        }
        itemSales[key].quantity += item.cantidad
        const extrasTotal = item.extras?.reduce((e, ex) => e + ex.precio, 0) || 0
        itemSales[key].revenue += (item.menuItem.precio + extrasTotal) * item.cantidad
      })
    })
    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
    
    // Calculate totals - combine payments and active paid sessions
    const grossSales = completedOrders.reduce((sum, o) => sum + calculateOrderTotal(o.items), 0)
    
    const totalTax = dayPayments.reduce((sum, p) => sum + p.impuestos, 0)
    const totalTips = dayPayments.reduce((sum, p) => sum + p.propina, 0)
    const totalDiscounts = dayPayments.reduce((sum, p) => sum + p.descuento, 0)
    const totalRefunds = dayRefunds.reduce((sum, r) => sum + r.monto, 0)
    const netSales = grossSales - totalDiscounts - totalRefunds
    
    // Average order value
    const avgOrderValue = completedOrders.length > 0 
      ? grossSales / completedOrders.length 
      : 0
    
    // Prep times
    const ordersWithPrepTime = completedOrders.filter(o => o.tiempoInicioPreparacion && o.tiempoFinPreparacion)
    const avgPrepTime = ordersWithPrepTime.length > 0
      ? ordersWithPrepTime.reduce((sum, o) => {
          const start = new Date(o.tiempoInicioPreparacion!).getTime()
          const end = new Date(o.tiempoFinPreparacion!).getTime()
          return sum + (end - start) / 1000 / 60
        }, 0) / ordersWithPrepTime.length
      : 0
    
    return {
      totalOrders: dayOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      grossSales,
      netSales,
      totalTax,
      totalTips,
      totalDiscounts,
      totalRefunds,
      avgOrderValue,
      avgPrepTime,
      salesByChannel,
      salesByPayment,
      topItems,
    }
  }, [dayOrders, dayRefunds, dayPayments])
  
  const handlePrint = useCallback(() => {
    logAction('imprimir_cierre', `Cierre diario impreso - ${selectedDate} - Ventas $${stats.netSales?.toFixed(2)}`, 'closing', selectedDate)
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const channelRows = Object.entries(stats.salesByChannel).map(
      ([ch, amt]) => `<tr><td>${ch === 'mesa' ? 'Mesa' : ch === 'mesero' ? 'Mesero' : ch === 'para_llevar' ? 'Para llevar' : 'Delivery'}</td><td style="text-align:right">$${(amt as number).toFixed(2)}</td></tr>`
    ).join('')

    const paymentRows = Object.entries(stats.salesByPayment).map(
      ([m, amt]) => `<tr><td>${getPaymentMethodLabel(m as PaymentMethod)}</td><td style="text-align:right">$${(amt as number).toFixed(2)}</td></tr>`
    ).join('')

    const topItemRows = stats.topItems.map(
      (item, i) => `<tr><td>${i + 1}. ${item.name} (x${item.quantity})</td><td style="text-align:right">$${item.revenue.toFixed(2)}</td></tr>`
    ).join('')

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Corte ${selectedDate}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:system-ui,-apple-system,sans-serif;font-size:13px;padding:24px;max-width:700px;margin:0 auto;color:#1a1a1a}
      h1{font-size:20px;text-align:center;margin-bottom:2px}
      .subtitle{text-align:center;color:#666;font-size:12px;margin-bottom:16px}
      .sep{border-top:2px solid #000;margin:12px 0}
      .sep-light{border-top:1px solid #ddd;margin:8px 0}
      .section-title{font-size:14px;font-weight:700;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid #ccc}
      .stats-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px}
      .stat-box{border:1px solid #ddd;border-radius:6px;padding:10px;text-align:center}
      .stat-value{font-size:18px;font-weight:700}
      .stat-label{font-size:10px;color:#666;margin-top:2px}
      table{width:100%;border-collapse:collapse}
      td{padding:4px 0;vertical-align:top}
      .total-row td{font-weight:700;padding-top:8px;border-top:2px solid #000}
      .green{color:#16a34a} .red{color:#dc2626}
      .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      @media print{body{padding:0;font-size:11px} .stat-value{font-size:14px} .stats-grid{gap:6px}}
    </style></head><body>
      <h1>Pa Que Vos Veais</h1>
      <div class="subtitle">CORTE DEL DIA - ${selectedDate}</div>
      <div class="sep"></div>

      <div class="stats-grid">
        <div class="stat-box"><div class="stat-value">$${stats.netSales.toFixed(2)}</div><div class="stat-label">Ventas Netas</div></div>
        <div class="stat-box"><div class="stat-value">${stats.completedOrders}</div><div class="stat-label">Pedidos</div></div>
        <div class="stat-box"><div class="stat-value">$${stats.avgOrderValue.toFixed(2)}</div><div class="stat-label">Ticket Prom.</div></div>
        <div class="stat-box"><div class="stat-value">${stats.avgPrepTime.toFixed(1)}m</div><div class="stat-label">Tiempo Prep.</div></div>
      </div>

      <div class="section-title">Resumen Financiero</div>
      <table>
        <tr><td>Ventas Brutas</td><td style="text-align:right">$${stats.grossSales.toFixed(2)}</td></tr>
        <tr><td class="red">(-) Descuentos</td><td style="text-align:right" class="red">$${stats.totalDiscounts.toFixed(2)}</td></tr>
        <tr><td class="red">(-) Reembolsos</td><td style="text-align:right" class="red">$${stats.totalRefunds.toFixed(2)}</td></tr>
        <tr class="total-row"><td>Ventas Netas</td><td style="text-align:right">$${stats.netSales.toFixed(2)}</td></tr>
        <tr><td style="color:#666">IVA (incluido)</td><td style="text-align:right;color:#666">$${stats.totalTax.toFixed(2)}</td></tr>
        <tr><td class="green">Propinas</td><td style="text-align:right" class="green">$${stats.totalTips.toFixed(2)}</td></tr>
      </table>

      <div class="two-col">
        <div>
          <div class="section-title">Ventas por Canal</div>
          <table>${channelRows || '<tr><td colspan="2" style="color:#999;text-align:center">Sin ventas</td></tr>'}</table>
        </div>
        <div>
          <div class="section-title">Por Metodo de Pago</div>
          <table>${paymentRows || '<tr><td colspan="2" style="color:#999;text-align:center">Sin pagos</td></tr>'}</table>
        </div>
      </div>

      <div class="section-title">Platillos mas Vendidos</div>
      <table>${topItemRows || '<tr><td colspan="2" style="color:#999;text-align:center">Sin ventas</td></tr>'}</table>

      ${stats.cancelledOrders > 0 ? `<div class="sep-light"></div><div style="color:#dc2626;font-weight:600">Pedidos Cancelados: ${stats.cancelledOrders}</div>` : ''}

      <div class="sep"></div>
      <div style="text-align:center;font-size:11px;color:#666;margin-top:8px">
        <div>Generado: ${new Date().toLocaleString('es-MX')}</div>
      </div>
    </body></html>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 300)
  }, [selectedDate, stats, logAction])
  
  const exportCSV = () => {
    const headers = ['Metrica', 'Valor']
    const rows = [
      ['Fecha', selectedDate],
      ['Total Pedidos', stats.totalOrders.toString()],
      ['Pedidos Completados', stats.completedOrders.toString()],
      ['Pedidos Cancelados', stats.cancelledOrders.toString()],
      ['Ventas Brutas', formatPrice(stats.grossSales)],
      ['Descuentos', formatPrice(stats.totalDiscounts)],
      ['Reembolsos', formatPrice(stats.totalRefunds)],
      ['Ventas Netas', formatPrice(stats.netSales)],
      ['IVA Cobrado', formatPrice(stats.totalTax)],
      ['Propinas', formatPrice(stats.totalTips)],
      ['Ticket Promedio', formatPrice(stats.avgOrderValue)],
      ['Tiempo Promedio Prep', `${stats.avgPrepTime.toFixed(1)} min`],
    ]
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `corte-${selectedDate}.csv`
    link.click()
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Corte del Dia
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-xs text-muted-foreground">Resumen de operaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="h-8 px-2 text-xs border border-border rounded-md"
          />
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1 bg-transparent" disabled={loading}>
            <Download className="h-3 w-3" />
            CSV
          </Button>
          <Button size="sm" onClick={() => handlePrint()} className="gap-1" disabled={loading}>
            <Printer className="h-3 w-3" />
            Imprimir
          </Button>
        </div>
      </div>
      
      {/* Printable content */}
      <div className="print:p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <DollarSign className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Ventas Netas</p>
                  <p className="text-sm font-bold">{formatPrice(stats.netSales)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-blue-100">
                  <ShoppingBag className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Pedidos</p>
                  <p className="text-sm font-bold">{stats.completedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-green-100">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Ticket Promedio</p>
                  <p className="text-sm font-bold">{formatPrice(stats.avgOrderValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-amber-100">
                  <Clock className="h-3 w-3 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Tiempo Prep.</p>
                  <p className="text-sm font-bold">{stats.avgPrepTime.toFixed(1)} min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Financial Summary */}
        <Card className="mb-4">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Ventas Brutas</span>
                <span className="font-medium">{formatPrice(stats.grossSales)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>(-) Descuentos</span>
                <span>{formatPrice(stats.totalDiscounts)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>(-) Reembolsos</span>
                <span>{formatPrice(stats.totalRefunds)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Ventas Netas</span>
                <span>{formatPrice(stats.netSales)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA (incluido)</span>
                <span>{formatPrice(stats.totalTax)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Propinas recibidas</span>
                <span>{formatPrice(stats.totalTips)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* By Channel */}
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Ventas por Canal</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-1.5">
                {Object.entries(stats.salesByChannel).length > 0 ? (
                  Object.entries(stats.salesByChannel).map(([channel, amount]) => (
                    <div key={channel} className="flex justify-between items-center text-xs">
                      <span>{getChannelLabel(channel as Order['canal'])}</span>
                      <span className="font-medium">{formatPrice(amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">Sin ventas</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* By Payment Method */}
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Por Metodo de Pago</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-1.5">
                {Object.entries(stats.salesByPayment).length > 0 ? (
                  Object.entries(stats.salesByPayment).map(([method, amount]) => (
                    <div key={method} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        {method === 'tarjeta' || method === 'apple_pay' ? (
                          <CreditCard className="h-3 w-3" />
                        ) : (
                          <Banknote className="h-3 w-3" />
                        )}
                        <span>{getPaymentMethodLabel(method as PaymentMethod)}</span>
                      </div>
                      <span className="font-medium">{formatPrice(amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">Sin pagos registrados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Cash Drawer Count */}
        <Card className="mt-4">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Conteo de Caja (Efectivo)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
              {DENOMINATIONS.map(d => (
                <div key={d} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-14 text-right flex-shrink-0">
                    ${d >= 1 ? d.toLocaleString() : d}
                  </span>
                  <span className="text-xs text-muted-foreground">×</span>
                  <input
                    type="number"
                    min="0"
                    value={billCounts[d]}
                    onChange={e => setBillCounts(prev => ({ ...prev, [d]: e.target.value }))}
                    placeholder="0"
                    className="h-6 w-16 text-xs border border-border rounded px-1.5 bg-background text-foreground"
                  />
                  <span className="text-xs text-foreground font-medium ml-auto">
                    {(parseInt(billCounts[d]) || 0) > 0 ? `$${(d * (parseInt(billCounts[d]) || 0)).toLocaleString()}` : ''}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Total en caja:</span>
              <span className={`text-base font-bold ${cashTotal > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                {formatPrice(cashTotal)}
              </span>
            </div>
            {stats.salesByPayment['efectivo'] !== undefined && cashTotal > 0 && (
              <div className={`mt-2 p-2 rounded-lg text-xs text-center font-medium ${
                Math.abs(cashTotal - stats.salesByPayment['efectivo']) < 1
                  ? 'bg-green-100 text-green-800'
                  : cashTotal > stats.salesByPayment['efectivo']
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
              }`}>
                {Math.abs(cashTotal - stats.salesByPayment['efectivo']) < 1
                  ? '✓ Caja cuadrada'
                  : cashTotal > stats.salesByPayment['efectivo']
                    ? `Sobrante: ${formatPrice(cashTotal - stats.salesByPayment['efectivo'])}`
                    : `Faltante: ${formatPrice(stats.salesByPayment['efectivo'] - cashTotal)}`
                }
                {' '}(Sistema: {formatPrice(stats.salesByPayment['efectivo'])})
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card className="mt-4">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">Platillos mas Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {stats.topItems.length > 0 ? (
              <div className="space-y-1">
                {stats.topItems.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-4">{index + 1}.</span>
                      <span>{item.name}</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1">
                        x{item.quantity}
                      </Badge>
                    </div>
                    <span className="font-medium">{formatPrice(item.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Sin ventas en este dia</p>
            )}
          </CardContent>
        </Card>
        
        {/* Cancelled Orders */}
        {stats.cancelledOrders > 0 && (
          <Card className="mt-4 border-destructive/50">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                Pedidos Cancelados: {stats.cancelledOrders}
              </CardTitle>
            </CardHeader>
          </Card>
        )}
        
        {/* Print Footer */}
        <div className="hidden print:block mt-6 text-center text-xs text-gray-500 border-t pt-4">
          <p>Pa Que Vos Veais - Corte del dia</p>
          <p>Generado: {new Date().toLocaleString('es-MX')}</p>
        </div>
      </div>
    </div>
  )
}
