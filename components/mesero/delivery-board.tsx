'use client'

import { Check, Clock, Package, MapPin, Phone, Truck, ShoppingBag, AlertCircle } from 'lucide-react'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatTime, getChannelLabel, getStatusLabel, getTimeDiff, type OrderStatus } from '@/lib/store'

export function DeliveryBoard() {
  const { orders, updateOrderStatus } = useApp()
  
  // Get all orders that need delivery attention
  const pendingOrders = orders.filter(o => 
    o.status !== 'entregado' && 
    (o.canal === 'mesa' || o.canal === 'para_llevar' || o.canal === 'delivery' || o.canal === 'mesero')
  ).sort((a, b) => {
    // Prioritize ready orders
    if (a.status === 'listo' && b.status !== 'listo') return -1
    if (b.status === 'listo' && a.status !== 'listo') return 1
    // Then prioritize en_camino
    if (a.status === 'en_camino' && b.status !== 'en_camino') return -1
    if (b.status === 'en_camino' && a.status !== 'en_camino') return 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
  
  const handleMarkDelivered = (orderId: string) => {
    updateOrderStatus(orderId, 'entregado')
  }
  
  const handleMarkEnCamino = (orderId: string) => {
    updateOrderStatus(orderId, 'en_camino')
  }
  
  const readyCount = pendingOrders.filter(o => o.status === 'listo').length
  const preparingCount = pendingOrders.filter(o => o.status === 'preparando').length
  const enCaminoCount = pendingOrders.filter(o => o.status === 'en_camino').length
  
  return (
    <div className="p-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-2 text-center">
            <p className="text-xl font-bold text-success">{readyCount}</p>
            <p className="text-[9px] text-success">Listos</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-2 text-center">
            <p className="text-xl font-bold text-blue-500">{enCaminoCount}</p>
            <p className="text-[9px] text-blue-500">En camino</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-2 text-center">
            <p className="text-xl font-bold text-primary">{preparingCount}</p>
            <p className="text-[9px] text-primary">Preparando</p>
          </CardContent>
        </Card>
        <Card className="bg-muted border-border">
          <CardContent className="p-2 text-center">
            <p className="text-xl font-bold text-foreground">{pendingOrders.length}</p>
            <p className="text-[9px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Orders List */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-foreground">Tablero de entregas</h3>
        
        {pendingOrders.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Sin ordenes pendientes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {pendingOrders.map((order) => {
              const isReady = order.status === 'listo'
              const isEnCamino = order.status === 'en_camino'
              const needsA = order.items.some(i => i.menuItem.cocina === 'cocina_a' || i.menuItem.cocina === 'ambas')
              const needsB = order.items.some(i => i.menuItem.cocina === 'cocina_b' || i.menuItem.cocina === 'ambas')
              const aReady = !needsA || order.cocinaAStatus === 'listo'
              const bReady = !needsB || order.cocinaBStatus === 'listo'
              const allKitchensReady = aReady && bReady
              
              const total = order.items.reduce((sum, item) => {
                const extrasTotal = item.extras?.reduce((e, ex) => e + ex.precio, 0) || 0
                return sum + (item.menuItem.precio + extrasTotal) * item.cantidad
              }, 0)
              
              return (
                <Card 
                  key={order.id} 
                  className={`border transition-all ${
                    isReady ? 'border-success bg-success/5' : 
                    isEnCamino ? 'border-blue-500 bg-blue-50' :
                    'border-border'
                  }`}
                >
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm">#{order.numero}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className={`text-[10px] h-4 px-1 ${
                            order.canal === 'delivery' ? 'border-blue-500 text-blue-500' :
                            order.canal === 'para_llevar' ? 'border-amber-500 text-amber-500' :
                            ''
                          }`}>
                            {order.canal === 'delivery' && <Truck className="h-2.5 w-2.5 mr-0.5" />}
                            {order.canal === 'para_llevar' && <ShoppingBag className="h-2.5 w-2.5 mr-0.5" />}
                            {getChannelLabel(order.canal)}
                          </Badge>
                          {order.mesa && (
                            <span className="text-[10px] text-muted-foreground">
                              Mesa {order.mesa}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-[10px] h-4 ${
                          isReady ? 'bg-success text-success-foreground' :
                          isEnCamino ? 'bg-blue-500 text-white' :
                          order.status === 'preparando' ? 'bg-primary/20 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {isEnCamino ? 'En camino' : getStatusLabel(order.status)}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-end gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {getTimeDiff(order.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3 pt-0">
                    {/* Customer Info for delivery/para llevar */}
                    {(order.canal === 'delivery' || order.canal === 'para_llevar') && order.nombreCliente && (
                      <div className="mb-2 p-2 bg-secondary rounded text-xs">
                        <p className="font-medium text-foreground">{order.nombreCliente}</p>
                        {order.telefono && (
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />
                            {order.telefono}
                          </p>
                        )}
                        {order.direccion && (
                          <p className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {order.direccion}
                          </p>
                        )}
                        {order.zonaReparto && (
                          <Badge className="mt-1 text-[9px] h-4 bg-blue-100 text-blue-700">
                            {order.zonaReparto}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Items */}
                    <ul className="space-y-0.5 mb-2">
                      {order.items.map((item) => (
                        <li key={item.id} className="text-xs flex justify-between text-foreground">
                          <span>{item.cantidad}x {item.menuItem.nombre}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Total */}
                    <div className="flex justify-between text-xs mb-2 pt-1 border-t border-border">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold">{formatPrice(total)}</span>
                    </div>
                    
                    {/* Kitchen Status */}
                    {!isEnCamino && (
                      <div className="flex gap-1 text-[10px] mb-2">
                        {needsA && (
                          <span className={`px-1.5 py-0.5 rounded ${
                            order.cocinaAStatus === 'listo' ? 'bg-success/20 text-success' :
                            order.cocinaAStatus === 'preparando' ? 'bg-primary/20 text-primary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            A: {order.cocinaAStatus === 'listo' ? 'Listo' : 
                                order.cocinaAStatus === 'preparando' ? 'Prep.' : 'Cola'}
                          </span>
                        )}
                        {needsB && (
                          <span className={`px-1.5 py-0.5 rounded ${
                            order.cocinaBStatus === 'listo' ? 'bg-success/20 text-success' :
                            order.cocinaBStatus === 'preparando' ? 'bg-primary/20 text-primary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            B: {order.cocinaBStatus === 'listo' ? 'Listo' : 
                                order.cocinaBStatus === 'preparando' ? 'Prep.' : 'Cola'}
                          </span>
                        )}
                        {!allKitchensReady && (
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                            <AlertCircle className="h-2.5 w-2.5" />
                            Esperando
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Actions */}
                    {allKitchensReady && isReady && (
                      <div className="flex gap-1">
                        {order.canal === 'delivery' ? (
                          <>
                            <Button
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-7 text-xs"
                              onClick={() => handleMarkEnCamino(order.id)}
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              En camino
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="w-full bg-success hover:bg-success/90 text-success-foreground h-7 text-xs"
                            onClick={() => handleMarkDelivered(order.id)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {order.canal === 'para_llevar' ? 'Entregar' : 'Entregado'}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {isEnCamino && (
                      <Button
                        className="w-full bg-success hover:bg-success/90 text-success-foreground h-7 text-xs"
                        onClick={() => handleMarkDelivered(order.id)}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Entregado
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
