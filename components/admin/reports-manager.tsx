'use client'

import { TrendingUp, DollarSign, ShoppingBag, Clock, Users, Utensils } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/store'

export function ReportsManager() {
  const { orders, tableSessions } = useApp()
  
  // Calculate stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today)
  const completedTodayOrders = todayOrders.filter(o => o.status === 'entregado')
  
  const totalRevenue = completedTodayOrders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => {
      const extrasTotal = item.extras?.reduce((e, ex) => e + ex.precio, 0) || 0
      return itemSum + (item.menuItem.precio + extrasTotal) * item.cantidad
    }, 0)
  }, 0)
  
  const totalItems = completedTodayOrders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + item.cantidad, 0)
  }, 0)
  
  const avgOrderValue = completedTodayOrders.length > 0 
    ? totalRevenue / completedTodayOrders.length 
    : 0
  
  // Calculate average prep time
  const ordersWithTimes = completedTodayOrders.filter(
    o => o.tiempoInicioPreparacion && o.tiempoFinPreparacion
  )
  const avgPrepTime = ordersWithTimes.length > 0
    ? ordersWithTimes.reduce((sum, o) => {
        const start = new Date(o.tiempoInicioPreparacion!).getTime()
        const end = new Date(o.tiempoFinPreparacion!).getTime()
        return sum + (end - start) / 1000 / 60
      }, 0) / ordersWithTimes.length
    : 0
  
  // Orders by channel
  const ordersByChannel = {
    mesa: todayOrders.filter(o => o.canal === 'mesa' || o.canal === 'mesero').length,
    para_llevar: todayOrders.filter(o => o.canal === 'para_llevar').length,
    delivery: todayOrders.filter(o => o.canal === 'delivery').length,
  }
  
  // Top items
  const itemCounts: Record<string, { nombre: string; count: number; revenue: number }> = {}
  completedTodayOrders.forEach(order => {
    order.items.forEach(item => {
      const key = item.menuItem.id
      if (!itemCounts[key]) {
        itemCounts[key] = { nombre: item.menuItem.nombre, count: 0, revenue: 0 }
      }
      itemCounts[key].count += item.cantidad
      itemCounts[key].revenue += item.menuItem.precio * item.cantidad
    })
  })
  
  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  // Active tables
  const activeTables = tableSessions.filter(s => s.activa).length
  
  return (
    <div className="p-3">
      <div className="mb-3">
        <h2 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Reportes del dia
        </h2>
        <p className="text-[10px] text-muted-foreground">
          {today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
      
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-bold text-primary">{formatPrice(totalRevenue)}</p>
                <p className="text-[9px] text-muted-foreground">Ventas del dia</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-success" />
              <div>
                <p className="text-lg font-bold text-success">{completedTodayOrders.length}</p>
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
      
      {/* Orders by Channel */}
      <Card className="mb-3">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-xs">Pedidos por canal</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">En mesa</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(ordersByChannel.mesa / Math.max(todayOrders.length, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-6 text-right">{ordersByChannel.mesa}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Para llevar</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ width: `${(ordersByChannel.para_llevar / Math.max(todayOrders.length, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-6 text-right">{ordersByChannel.para_llevar}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Delivery</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success" 
                    style={{ width: `${(ordersByChannel.delivery / Math.max(todayOrders.length, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-6 text-right">{ordersByChannel.delivery}</span>
              </div>
            </div>
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
                    <span className="text-xs text-foreground truncate max-w-[120px]">
                      {item.nombre}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-foreground">{item.count} uds</span>
                    <span className="text-[9px] text-muted-foreground block">
                      {formatPrice(item.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sin ventas registradas hoy
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
