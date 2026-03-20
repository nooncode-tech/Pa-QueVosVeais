'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
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
  RotateCcw,
  Calendar
} from 'lucide-react'
import { 
  formatPrice, 
  formatDate, 
  calculateOrderTotal,
  getChannelLabel,
  type Order 
} from '@/lib/store'
import { useReactToPrint } from 'react-to-print'

export function DailyClosing() {
  const { orders, tableSessions, refunds, getPaymentsForDate } = useApp()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const printRef = useRef<HTMLDivElement>(null)
  
  // Filter data by selected date
  const dayOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
      return orderDate === selectedDate
    })
  }, [orders, selectedDate])
  
  const dayRefunds = useMemo(() => {
    return refunds.filter(refund => {
      const refundDate = new Date(refund.createdAt).toISOString().split('T')[0]
      return refundDate === selectedDate
    })
  }, [refunds, selectedDate])
  
  // Get payments for the selected date (these persist after session closes)
  const dayPayments = useMemo(() => {
    return getPaymentsForDate(new Date(selectedDate))
  }, [getPaymentsForDate, selectedDate])
  
  // Also keep daySessions for backward compatibility with any active sessions
  const daySessions = useMemo(() => {
    return tableSessions.filter(session => {
      const sessionDate = new Date(session.createdAt).toISOString().split('T')[0]
      return sessionDate === selectedDate && session.paymentStatus === 'pagado'
    })
  }, [tableSessions, selectedDate])
  
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
    
    // Sales by payment method - use payments array (persisted) + any active paid sessions
    const salesByPayment = dayPayments.reduce((acc, payment) => {
      acc[payment.paymentMethod ?? 'efectivo'] = (acc[payment.paymentMethod ?? 'efectivo'] || 0) + payment.total
      return acc
    }, {} as Record<string, number>)
    
    // Also add any active sessions that are paid (for current day live data)
    daySessions.forEach(session => {
      if (session.paymentMethod) {
        salesByPayment[session.paymentMethod] = (salesByPayment[session.paymentMethod] || 0) + session.total
      }
    })
    
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
    
    // Taxes and tips from persisted payments
    const paymentsTax = dayPayments.reduce((sum, p) => sum + p.impuestos, 0)
    const paymentsTips = dayPayments.reduce((sum, p) => sum + p.propina, 0)
    
    // Also from active sessions (live data)
    const sessionsTax = daySessions.reduce((sum, s) => sum + s.impuestos, 0)
    const sessionsTips = daySessions.reduce((sum, s) => sum + s.propina, 0)
    const sessionsDiscounts = daySessions.reduce((sum, s) => sum + s.descuento, 0)
    
    const totalTax = paymentsTax + sessionsTax
    const totalTips = paymentsTips + sessionsTips
    const totalDiscounts = sessionsDiscounts // Note: discounts are factored into session.total before payment
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
  }, [dayOrders, daySessions, dayRefunds, dayPayments])
  
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const channelRows = Object.entries(stats.salesByChannel).map(
      ([ch, amt]) => `<tr><td>${ch === 'mesa' ? 'Mesa' : ch === 'mesero' ? 'Mesero' : ch === 'para_llevar' ? 'Para llevar' : 'Delivery'}</td><td style="text-align:right">$${(amt as number).toFixed(2)}</td></tr>`
    ).join('')

    const paymentRows = Object.entries(stats.salesByPayment).map(
      ([m, amt]) => `<tr><td>${m === 'tarjeta' ? 'Tarjeta' : m === 'apple_pay' ? 'Apple Pay' : 'Efectivo'}</td><td style="text-align:right">$${(amt as number).toFixed(2)}</td></tr>`
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
  }, [selectedDate, stats])
  
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
          <h2 className="text-lg font-bold text-foreground">Corte del Dia</h2>
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
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1 bg-transparent">
            <Download className="h-3 w-3" />
            CSV
          </Button>
          <Button size="sm" onClick={() => handlePrint()} className="gap-1">
            <Printer className="h-3 w-3" />
            Imprimir
          </Button>
        </div>
      </div>
      
      {/* Printable content */}
      <div ref={printRef} className="print:p-4">
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
                        {method === 'tarjeta' ? (
                          <CreditCard className="h-3 w-3" />
                        ) : (
                          <Banknote className="h-3 w-3" />
                        )}
                        <span>{method === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}</span>
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
